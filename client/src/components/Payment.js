import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Grid
} from '@mui/material';

const Payment = ({ open, onClose, onSuccess }) => {
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
    paymentMethod: 'credit'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePaymentInfoChange = (e) => {
    const { name, value } = e.target;
    setPaymentInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentSubmit = async () => {
    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
      onSuccess();
      onClose();
    }, 1000);
  };

  return (
    <Dialog 
      open={open} 
      onClose={() => !loading && onClose()}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Premium Plan Payment</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Payment Method</InputLabel>
            <Select
              name="paymentMethod"
              value={paymentInfo.paymentMethod}
              onChange={handlePaymentInfoChange}
              label="Payment Method"
            >
              <MenuItem value="credit">Credit Card</MenuItem>
              <MenuItem value="momo">MoMo Wallet</MenuItem>
              <MenuItem value="vnpay">VNPay</MenuItem>
            </Select>
          </FormControl>

          {paymentInfo.paymentMethod === 'credit' ? (
            <>
              <TextField
                fullWidth
                label="Card Number"
                name="cardNumber"
                value={paymentInfo.cardNumber}
                onChange={handlePaymentInfoChange}
                sx={{ mb: 2 }}
                placeholder="XXXX XXXX XXXX XXXX"
              />
              <TextField
                fullWidth
                label="Card Holder"
                name="cardHolder"
                value={paymentInfo.cardHolder}
                onChange={handlePaymentInfoChange}
                sx={{ mb: 2 }}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Expiry Date"
                    name="expiryDate"
                    value={paymentInfo.expiryDate}
                    onChange={handlePaymentInfoChange}
                    placeholder="MM/YY"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="CVV"
                    name="cvv"
                    value={paymentInfo.cvv}
                    onChange={handlePaymentInfoChange}
                    type="password"
                  />
                </Grid>
              </Grid>
            </>
          ) : paymentInfo.paymentMethod === 'momo' ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              You will be redirected to MoMo payment page to complete the transaction.
            </Typography>
          ) : paymentInfo.paymentMethod === 'vnpay' ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              You will be redirected to VNPay payment page to complete the transaction.
            </Typography>
          ) : null}

          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handlePaymentSubmit} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Pay $199'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Payment; 