import React from 'react';
import { Alert, Collapse } from '@mui/material';
import { getErrorSeverity } from '../utils/errorHandler';

/**
 * Reusable error alert component with consistent styling
 */
const ErrorAlert = ({ 
  error, 
  onClose, 
  sx = {}, 
  severity = null,
  variant = 'filled',
  collapsible = true 
}) => {
  if (!error) return null;

  const alertSeverity = severity || getErrorSeverity(error);

  const alertComponent = (
    <Alert
      severity={alertSeverity}
      variant={variant}
      onClose={onClose}
      sx={{
        mb: 2,
        '& .MuiAlert-message': {
          width: '100%',
          wordBreak: 'break-word'
        },
        ...sx
      }}
    >
      {error}
    </Alert>
  );

  if (collapsible) {
    return (
      <Collapse in={!!error}>
        {alertComponent}
      </Collapse>
    );
  }

  return alertComponent;
};

export default ErrorAlert;