import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { GradientButton } from '@/components/ui/GradientButton';

const candidateSchema = z.object({
  associate_id: z.string().min(1, 'Associate Id is required'),
  name: z.string().min(2, 'Name is required'),
  cohort_code: z.string(),
  cognizant_email_id: z.string().email('Invalid email').optional().or(z.literal('')),
  join_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['active', 'inactive', 'completed']),
});

type CandidateFormData = z.infer<typeof candidateSchema>;

interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CandidateFormData) => void;
  cohortId: string;
  isLoading?: boolean;
  initialData?: Partial<CandidateFormData>;
  mode?: 'add' | 'edit';
}

export const AddCandidateModal = ({
  isOpen,
  onClose,
  onSubmit,
  cohortId,
  isLoading,
  initialData,
  mode = 'add',
}: AddCandidateModalProps) => {
  const form = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      associate_id: initialData?.associate_id || '',
      name: initialData?.name || '',
      cohort_code: initialData?.cohort_code || '',
      cognizant_email_id: initialData?.cognizant_email_id || '',
      join_date: initialData?.join_date || '',
      end_date: initialData?.end_date || '',
      status: initialData?.status || 'active',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        associate_id: initialData?.associate_id || '',
        name: initialData?.name || '',
        cohort_code: initialData?.cohort_code || '',
        cognizant_email_id: initialData?.cognizant_email_id || '',
        join_date: initialData?.join_date || '',
        end_date: initialData?.end_date || '',
        status: initialData?.status || 'active',
      });
    }
  }, [isOpen, initialData, form]);

  const handleSubmit = (data: CandidateFormData) => {
    onSubmit(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md border-border/50 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {mode === 'add' ? 'Add Candidate' : 'Edit Candidate'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="associate_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Associate ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Associate ID" className="input-premium" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Name" className="input-premium" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cohort_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cohort Code</FormLabel>
                    <FormControl>
                      <Input disabled className="input-premium bg-muted/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cognizant_email_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cognizant Email ID</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@cognizant.com" className="input-premium" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="join_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Join Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="input-premium" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="input-premium" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <select {...field} className="input-premium w-full bg-background">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="completed">Completed</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <GradientButton type="button" variant="ghost" onClick={handleClose}>
                Cancel
              </GradientButton>
              <GradientButton type="submit" variant="primary" disabled={isLoading}>
                {isLoading ? 'Saving...' : mode === 'add' ? 'Add Candidate' : 'Save Changes'}
              </GradientButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};