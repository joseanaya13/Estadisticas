import { clsx } from 'clsx';

export const Card = ({ children, className, ...props }) => {
  return (
    <div
      className={clsx(
        "bg-white rounded-lg shadow-md border border-gray-200 p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className, ...props }) => {
  return (
    <div
      className={clsx(
        "mb-4 pb-4 border-b border-gray-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className, ...props }) => {
  return (
    <h3
      className={clsx(
        "text-lg font-semibold text-gray-900",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardContent = ({ children, className, ...props }) => {
  return (
    <div
      className={clsx("text-gray-600", className)}
      {...props}
    >
      {children}
    </div>
  );
};