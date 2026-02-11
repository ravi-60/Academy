import * as React from "react";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Search,
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface Column<T> {
    header: string;
    accessorKey: keyof T | string;
    cell?: (item: T) => React.ReactNode;
    sortable?: boolean;
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    pageSize?: number;
    onRowClick?: (item: T) => void;
    className?: string;
    searchPlaceholder?: string;
    searchKey?: keyof T;
}

export function DataTable<T>({
    data,
    columns,
    pageSize = 10,
    onRowClick,
    className,
    searchPlaceholder = "Search...",
    searchKey,
}: DataTableProps<T>) {
    const [currentPage, setCurrentPage] = React.useState(1);
    const [sortConfig, setSortConfig] = React.useState<{
        key: string;
        direction: "asc" | "desc" | null;
    }>({ key: "", direction: null });
    const [searchQuery, setSearchQuery] = React.useState("");

    // Helper for nested access
    const getValue = (obj: any, path: string) => {
        if (!path) return undefined;
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    // Filtering
    const filteredData = React.useMemo(() => {
        if (!searchQuery || !searchKey) return data;
        return data.filter((item) => {
            const val = getValue(item, searchKey as string);
            return String(val || "").toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [data, searchQuery, searchKey]);

    // Sorting
    const sortedData = React.useMemo(() => {
        if (!sortConfig.key || !sortConfig.direction) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aValue = getValue(a, sortConfig.key);
            const bValue = getValue(b, sortConfig.key);

            if (aValue === bValue) return 0;
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig]);

    // Pagination
    const totalPages = Math.ceil(sortedData.length / pageSize);
    const paginatedData = sortedData.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handleSort = (key: string) => {
        let direction: "asc" | "desc" | null = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        } else if (sortConfig.key === key && sortConfig.direction === "desc") {
            direction = null;
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (column: Column<T>) => {
        if (!column.sortable) return null;
        if (sortConfig.key !== column.accessorKey)
            return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
        if (sortConfig.direction === "asc")
            return <ArrowUp className="ml-2 h-4 w-4 text-primary" />;
        if (sortConfig.direction === "desc")
            return <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
        return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    };

    // Reset to page 1 on search or sort
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, sortConfig]);

    return (
        <div className={cn("space-y-4", className)}>
            {searchKey && (
                <div className="relative group max-w-sm">
                    <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20 blur opacity-25 group-hover:opacity-50 transition-opacity" />
                    <div className="relative flex items-center">
                        <Search className="absolute left-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-background/50 border-border/40 pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                        />
                    </div>
                </div>
            )}

            <div className="rounded-2xl border border-border/10 overflow-hidden bg-card/30 backdrop-blur-md">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="border-border/10 hover:bg-transparent">
                            {columns.map((column, idx) => (
                                <TableHead
                                    key={idx}
                                    className={cn(
                                        "h-14 font-black text-[10px] uppercase tracking-widest text-muted-foreground/70 transition-colors",
                                        column.sortable && "cursor-pointer hover:text-primary hover:bg-primary/5",
                                        column.className
                                    )}
                                    onClick={() => column.sortable && handleSort(column.accessorKey as string)}
                                >
                                    <div className="flex items-center">
                                        {column.header}
                                        {getSortIcon(column)}
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <AnimatePresence mode="popLayout">
                            {paginatedData.length > 0 ? (
                                paginatedData.map((item, idx) => (
                                    <TableRow
                                        key={(item as any).id || idx}
                                        className={cn(
                                            "border-border/5 transition-all duration-300 hover:bg-white/5 group",
                                            onRowClick && "cursor-pointer"
                                        )}
                                        onClick={() => onRowClick?.(item)}
                                    >
                                        {columns.map((column, colIdx) => (
                                            <TableCell
                                                key={colIdx}
                                                className={cn("py-4", column.className)}
                                            >
                                                {column.cell ? column.cell(item) : (item as any)[column.accessorKey]}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-32 text-center text-muted-foreground italic"
                                    >
                                        No results found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </AnimatePresence>
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                    <div className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                        Showing <span className="text-foreground">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                        <span className="text-foreground">
                            {Math.min(currentPage * pageSize, sortedData.length)}
                        </span>{" "}
                        of <span className="text-foreground">{sortedData.length}</span> nodes
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg bg-card/50 border border-border/40 hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-all"
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg bg-card/50 border border-border/40 hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-all"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNumber;
                                if (totalPages <= 5) {
                                    pageNumber = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNumber = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNumber = totalPages - 4 + i;
                                } else {
                                    pageNumber = currentPage - 2 + i;
                                }

                                return (
                                    <button
                                        key={pageNumber}
                                        onClick={() => setCurrentPage(pageNumber)}
                                        className={cn(
                                            "h-9 w-9 rounded-lg border font-bold text-xs transition-all",
                                            currentPage === pageNumber
                                                ? "bg-primary border-primary text-white shadow-neon-blue/20"
                                                : "bg-card/50 border-border/40 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                        )}
                                    >
                                        {pageNumber}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg bg-card/50 border border-border/40 hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-all"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg bg-card/50 border border-border/40 hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-all"
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
