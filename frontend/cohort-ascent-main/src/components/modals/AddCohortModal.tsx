import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';

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
import { motion } from 'framer-motion';

const cohortSchema = z.object({
  code: z.string().min(1, 'Cohort code is required'),
  name: z.string().min(2, 'Name is required'),
  bu: z.string().min(1, 'Business unit is required'),
  skill: z.string().min(1, 'Skill is required'),
  location: z.string().min(1, 'Location is required'),
  coachId: z.string().optional(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
});

type CohortFormData = z.infer<typeof cohortSchema>;

interface Coach {
  id: string;
  name: string;
}

interface AddCohortModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  coaches: Coach[];
  isLoading?: boolean;
  initialData?: any;
  isEdit?: boolean;
}

export const AddCohortModal = ({
  isOpen,
  onClose,
  onSubmit,
  coaches,
  isLoading,
  initialData,
  isEdit,
}: AddCohortModalProps) => {
  const form = useForm<CohortFormData>({
    resolver: zodResolver(cohortSchema),
    defaultValues: {
      code: '',
      name: '',
      bu: '',
      skill: '',
      location: '',
      coachId: '',
      start_date: '',
      end_date: '',
    },
  });

  const [buValue, setBuValue] = useState('');
  const [customBU, setCustomBU] = useState('');

  // Update form when initialData changes
  useEffect(() => {
    if (initialData && isEdit) {
      form.reset({
        code: initialData.code || '',
        name: initialData.name || '',
        bu: initialData.bu || '',
        skill: initialData.skill || '',
        location: initialData.location || '',
        coachId: initialData.coachId || '',
        start_date: initialData.startDate ? initialData.startDate.split('T')[0] : '',
        end_date: initialData.endDate ? initialData.endDate.split('T')[0] : '',
      });
      setBuValue(initialData.bu || '');
    } else if (!isEdit) {
      form.reset({
        code: '',
        name: '',
        bu: '',
        skill: '',
        location: '',
        coachId: '',
        start_date: '',
        end_date: '',
      });
      setBuValue('');
    }
  }, [initialData, isEdit, form, isOpen]);

  const handleSubmit = (data: CohortFormData) => {
    // Transform data to match backend DTO
    const payload: any = {
      code: data.code,
      bu: buValue === 'OTHER' ? customBU : data.bu,
      skill: data.skill,
      trainingLocation: data.location, // Map location -> trainingLocation
      startDate: data.start_date, // Map start_date -> startDate
      endDate: data.end_date || null, // Map end_date -> endDate
      activeGencCount: initialData?.activeGencCount || 0
    };

    if (data.coachId) {
      payload.coachId = parseInt(data.coachId, 10);
    }

    onSubmit(payload);
  };


  const handleClose = () => {
    form.reset();
    setBuValue('');
    setCustomBU('');
    onClose();
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl border-border/50 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isEdit ? 'Update Cohort' : 'Create New Cohort'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cohort Code</FormLabel>
                    <FormControl>
                      <Input placeholder="GC-2024-BLR-01" className="input-premium" {...field} />
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
                    <FormLabel>Cohort Name</FormLabel>
                    <FormControl>
                      <Input placeholder="GenC Batch Alpha" className="input-premium" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* <FormField
                control={form.control}
                name="bu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Unit</FormLabel>
                    <FormControl>
                      <select {...field} className="input-premium w-full">
                        <option value="">Select BU...</option>
                        <option value="Digital Engineering">Digital Engineering</option>
                        <option value="Cloud & Infrastructure">Cloud & Infrastructure</option>
                        <option value="Data & AI">Data & AI</option>
                        <option value="Enterprise Applications">Enterprise Applications</option>
                        <option value="Quality Engineering">Quality Engineering</option>
                        <option value="OTHER">Other</option>
                      </select>
                      {buValue === 'OTHER' && (
                        <motion.input
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        placeholder="Enter custom business unit"
                        value={customBU}
                        onChange={(e) => setCustomBU(e.target.value)}
                        className="input-premium mt-2 w-full"
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}

              <FormField
                control={form.control}
                name="bu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Unit</FormLabel>
                    <FormControl>
                      <>
                        <select
                          value={buValue || field.value}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            setBuValue(e.target.value);
                          }}
                          className="input-premium w-full"
                        >
                          <option value="">Select BU...</option>
                          <option value="Digital Engineering">Digital Engineering</option>
                          <option value="Cloud & Infrastructure">Cloud & Infrastructure</option>
                          <option value="Data & AI">Data & AI</option>
                          <option value="Enterprise Applications">Enterprise Applications</option>
                          <option value="Quality Engineering">Quality Engineering</option>
                          <option value="OTHER">Other</option>
                        </select>

                        {buValue === 'OTHER' && (
                          <motion.input
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            placeholder="Enter custom business unit"
                            value={customBU}
                            onChange={(e) => setCustomBU(e.target.value)}
                            className="input-premium mt-2 w-full"
                          />
                        )}
                      </>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


              <FormField
                control={form.control}
                name="skill"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill / Technology</FormLabel>
                    <FormControl>
                      <Input placeholder="React, Node.js, AWS" className="input-premium" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Training Location</FormLabel>
                    <FormControl>
                      <select {...field} className="input-premium w-full">
                        <option value="">Select location...</option>
                        <option value="Bangalore">Bangalore</option>
                        <option value="Chennai">Chennai</option>
                        <option value="Hyderabad">Hyderabad</option>
                        <option value="Pune">Pune</option>
                        <option value="Mumbai">Mumbai</option>
                        <option value="Delhi">Delhi</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="coachId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Coach</FormLabel>
                    <FormControl>
                      <select {...field} className="input-premium w-full">
                        <option value="">Select coach...</option>
                        {coaches.map((coach) => (
                          <option key={coach.id} value={coach.id}>
                            {coach.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
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
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" className="input-premium" {...field} />
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
                {isLoading
                  ? (isEdit ? 'Updating...' : 'Creating...')
                  : (isEdit ? 'Update Cohort' : 'Create Cohort')}
              </GradientButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};