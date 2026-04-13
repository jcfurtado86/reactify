import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';


export default forwardRef(function TextInput(
    { type = 'text', className = '', isFocused = false, ...props },
    ref,
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type={type}
            className={
                'rounded-md border border-input bg-background text-foreground shadow-sm px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-primary focus:outline-none ' +
                className
            }
            ref={localRef}
        />
    );
});
