import * as RadixSelect from '@radix-ui/react-select';
import {forwardRef, LegacyRef, RefAttributes} from 'react';
import * as React from "react";
import {SelectItemProps, SelectProps} from "@radix-ui/react-select";
import { CheckIcon } from '@radix-ui/react-icons';

export interface SelectOption {
    id: string;
    label: string;
}

export interface SelectOptionProps extends SelectProps {
    options: SelectOption[];
    placeholder?: string;
    className?: string;
    hideDropIcon?: boolean;
}


const SelectItem = forwardRef(({children, className, ...props} : SelectItemProps & RefAttributes<HTMLDivElement>, ref: LegacyRef<HTMLDivElement>) => {
    return (
        <RadixSelect.Item className={`SelectItem ${className || ''}`} {...props} ref={ref}>
            <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
            <RadixSelect.ItemIndicator className="absolute left-0 w-[25px] inline-flex items-center justify-center">
                <CheckIcon />
            </RadixSelect.ItemIndicator>
        </RadixSelect.Item>
    );
});

export default function Select ({options, placeholder, className='', hideDropIcon=false, ...props}: SelectOptionProps) {
    return <RadixSelect.Root {...props}>
        <RadixSelect.Trigger className={`SelectTrigger ${className}`} aria-label={props.name || 'Select'}>
            <RadixSelect.Value placeholder={placeholder || 'Select ...'} />
            { !hideDropIcon &&
                <RadixSelect.Icon className="SelectIcon">
                    <div>ChevronDownIcon</div>
                </RadixSelect.Icon>
            }
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
            <RadixSelect.Content className="SelectContent" position={'popper'}>
                <RadixSelect.ScrollUpButton className="SelectScrollButton">
                    <div>ChevronUpIcon</div>
                </RadixSelect.ScrollUpButton>
                <RadixSelect.Viewport className="SelectViewport">
                    <RadixSelect.Group>
                        {
                            options.map((opt) => {
                                return <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                            })
                        }
                    </RadixSelect.Group>
                </RadixSelect.Viewport>
                <RadixSelect.ScrollDownButton className="SelectScrollButton">
                    <div>ChevronDownIcon</div>
                </RadixSelect.ScrollDownButton>
            </RadixSelect.Content>
        </RadixSelect.Portal>
    </RadixSelect.Root>
}
