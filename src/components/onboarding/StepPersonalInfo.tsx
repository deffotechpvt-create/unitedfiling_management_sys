'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'; // Removed as file does not exist

const formSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
});

export function StepPersonalInfo() {
    const { data, updateData, nextStep, prevStep } = useOnboardingStore();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: data.personalInfo.name || '',
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        updateData({ personalInfo: { name: values.name } });
        nextStep();
    }

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Personal Information
                </h1>
                <p className="text-slate-500">
                    Please tell us your full name to personalize your experience.
                </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md">
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Full Name
                        </label>
                        <Input
                            id="name"
                            placeholder="Ex. John Doe"
                            {...form.register('name')}
                            className="h-12"
                        />
                        {form.formState.errors.name && (
                            <p className="text-sm font-medium text-red-500">
                                {form.formState.errors.name.message}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={prevStep} type="button">
                        Back
                    </Button>
                    <Button type="submit" className="bg-slate-900 text-white hover:bg-slate-800">
                        Next
                    </Button>
                </div>
            </form>
        </div>
    );
}
