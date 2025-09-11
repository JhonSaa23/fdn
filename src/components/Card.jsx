import { clsx } from 'clsx';

function Card({ children, className, ...props }) {
  return (
    <div className={clsx('card', className)} {...props}>
      {children}
    </div>
  );
}

function CardHeader({ children, className, ...props }) {
  return (
    <div className={clsx('card-header', className)} {...props}>
      {children}
    </div>
  );
}

function CardBody({ children, className, ...props }) {
  return (
    <div className={clsx('card-body', className)} {...props}>
      {children}
    </div>
  );
}

function CardTitle({ children, className, ...props }) {
  return (
    <h2 className={clsx('text-lg font-medium text-gray-900', className)} {...props}>
      {children}
    </h2>
  );
}

function CardText({ children, className, ...props }) {
  return (
    <p className={clsx('mt-1 text-sm text-gray-500', className)} {...props}>
      {children}
    </p>
  );
}

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Title = CardTitle;
Card.Text = CardText;

export default Card; 
