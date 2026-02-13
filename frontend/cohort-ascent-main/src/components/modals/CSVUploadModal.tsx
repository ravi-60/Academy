import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, FileSpreadsheet, AlertCircle, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GradientButton } from '@/components/ui/GradientButton';

interface CSVUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: Record<string, string>[]) => void;
  title: string;
  requiredColumns: string[];
  optionalColumns?: string[];
  initialFile?: File | null;
}

export const CSVUploadModal = ({
  isOpen,
  onClose,
  onUpload,
  title,
  requiredColumns,
  optionalColumns,
  initialFile,
}: CSVUploadModalProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, string>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialFile && isOpen) {
      handleFile(initialFile);
    }
  }, [initialFile, isOpen]);

  const normalizeHeader = (h: string) =>
    h.trim().toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

  const handleFile = async (selectedFile: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');

      let data: Record<string, any>[] = [];

      if (isExcel) {
        const buffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        data = XLSX.utils.sheet_to_json(worksheet);
      } else {
        const text = await selectedFile.text();
        const workbook = XLSX.read(text, { type: 'string' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        data = XLSX.utils.sheet_to_json(worksheet);
      }

      if (data.length === 0) {
        setError('No data found in the file');
        return;
      }

      // Normalize headers for processing
      const normalizedData = data.map(row => {
        const newRow: Record<string, string> = {};
        Object.keys(row).forEach(key => {
          newRow[normalizeHeader(key)] = String(row[key]);
        });
        return newRow;
      });

      const firstRowKeys = Object.keys(normalizedData[0]);
      const normalizedRequired = requiredColumns.map(normalizeHeader);

      const missingColumns = requiredColumns.filter((col, idx) =>
        !firstRowKeys.includes(normalizedRequired[idx])
      );

      if (missingColumns.length > 0) {
        setError(`Missing required columns: ${missingColumns.join(', ')}`);
        return;
      }

      setFile(selectedFile);
      setParsedData(normalizedData);
    } catch (err) {
      console.error('Parsing error:', err);
      setError('Failed to parse file. Please ensure it is a valid CSV or Excel file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  };

  const handleSubmit = () => {
    onUpload(parsedData);
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl border-border/50 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!file ? (
            <>
              <div
                className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all ${isDragOver ? 'border-primary bg-primary/5' : 'border-border/50'
                  }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) handleFile(selectedFile);
                  }}
                />
                <Upload className={`mx-auto h-12 w-12 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  Drag & Drop your file here
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Or click to browse (CSV or Excel files)
                </p>
                <GradientButton
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse Files
                </GradientButton>
              </div>

              <div className="rounded-lg border border-border/30 bg-muted/20 p-4">
                <h4 className="text-sm font-medium text-foreground">Required Columns:</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {requiredColumns.map((col) => (
                    <span key={col} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {col}
                    </span>
                  ))}
                  {optionalColumns && optionalColumns.map((col) => (
                    <span key={col} className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary border border-secondary/20">
                      {col} (Optional)
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/10 p-4">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-success" />
                  <div>
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {parsedData.length} records found
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setParsedData([]);
                  }}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {parsedData.length > 0 && (
                <div className="max-h-80 overflow-auto rounded-lg border border-border/30 custom-scrollbar">
                  <table className="w-full text-sm border-collapse min-w-[600px]">
                    <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10 shadow-sm">
                      <tr>
                        {Object.keys(parsedData[0]).slice(0, 6).map((header) => (
                          <th key={header} className="px-4 py-3 text-left font-bold text-foreground border-b border-border/30 whitespace-nowrap uppercase tracking-wider text-[10px]">
                            {header.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-t border-border/10 hover:bg-white/5 transition-colors">
                          {Object.values(row).slice(0, 6).map((value, j) => (
                            <td key={j} className="px-4 py-3 text-muted-foreground break-all max-w-[200px]">
                              {value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedData.length > 10 && (
                    <div className="bg-muted/30 px-4 py-3 text-center text-xs font-medium text-muted-foreground border-t border-border/10">
                      Viewing first 10 records • Total {parsedData.length} entries awaiting import
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <GradientButton variant="ghost" onClick={handleClose}>
              Cancel
            </GradientButton>
            <GradientButton
              variant="primary"
              disabled={parsedData.length === 0 || isProcessing}
              onClick={handleSubmit}
              icon={<Check className="h-4 w-4" />}
            >
              Import {parsedData.length > 0 ? `${parsedData.length} Records` : ''}
            </GradientButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};