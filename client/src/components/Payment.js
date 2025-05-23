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
      <DialogTitle>Thanh toán gói Premium</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Phương thức thanh toán</InputLabel>
            <Select
              name="paymentMethod"
              value={paymentInfo.paymentMethod}
              onChange={handlePaymentInfoChange}
              label="Phương thức thanh toán"
            >
              <MenuItem value="credit">Thẻ tín dụng</MenuItem>
              <MenuItem value="momo">Ví MoMo</MenuItem>
              <MenuItem value="vnpay">VNPay</MenuItem>
            </Select>
          </FormControl>

          {paymentInfo.paymentMethod === 'credit' ? (
            <>
              <TextField
                fullWidth
                label="Số thẻ"
                name="cardNumber"
                value={paymentInfo.cardNumber}
                onChange={handlePaymentInfoChange}
                sx={{ mb: 2 }}
                placeholder="XXXX XXXX XXXX XXXX"
              />
              <TextField
                fullWidth
                label="Tên chủ thẻ"
                name="cardHolder"
                value={paymentInfo.cardHolder}
                onChange={handlePaymentInfoChange}
                sx={{ mb: 2 }}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Ngày hết hạn"
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
              Bạn sẽ được chuyển đến trang thanh toán MoMo để hoàn tất giao dịch.
            </Typography>
          ) : paymentInfo.paymentMethod === 'vnpay' ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Bạn sẽ được chuyển đến trang thanh toán VNPay để hoàn tất giao dịch.
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
          Hủy
        </Button>
        <Button 
          onClick={handlePaymentSubmit} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? 'Đang xử lý...' : 'Thanh toán 199.000đ'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Payment; 