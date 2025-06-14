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
    paymentMethod: 'credit',
    phoneNumber: '',
    bankCode: ''
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

  const validate = () => {
    if (paymentInfo.paymentMethod === 'credit') {
      if (!/^[0-9]{16}$/.test(paymentInfo.cardNumber.replace(/\s/g, ''))) {
        setError('Số thẻ phải có 16 chữ số');
        return false;
      }
      if (!paymentInfo.cardHolder.trim()) {
        setError('Vui lòng nhập tên chủ thẻ');
        return false;
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentInfo.expiryDate)) {
        setError('Ngày hết hạn không hợp lệ (MM/YY)');
        return false;
      }
      if (!/^[0-9]{3,4}$/.test(paymentInfo.cvv)) {
        setError('CVV không hợp lệ');
        return false;
      }
    } else if (paymentInfo.paymentMethod === 'momo') {
      if (!paymentInfo.phoneNumber || !/^[0-9]{10}$/.test(paymentInfo.phoneNumber)) {
        setError('Vui lòng nhập số điện thoại MoMo hợp lệ');
        return false;
      }
    } else if (paymentInfo.paymentMethod === 'vnpay') {
      if (!paymentInfo.bankCode) {
        setError('Vui lòng chọn ngân hàng');
        return false;
      }
    }
    setError('');
    return true;
  };

  const handlePaymentSubmit = async () => {
    if (!validate()) return;
    
    setLoading(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Payment error:', error);
      setError('Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentMethodFields = () => {
    switch (paymentInfo.paymentMethod) {
      case 'credit':
        return (
          <>
            <TextField
              fullWidth
              label="Số thẻ"
              name="cardNumber"
              value={paymentInfo.cardNumber}
              onChange={handlePaymentInfoChange}
              sx={{ mb: 2 }}
              placeholder="XXXX XXXX XXXX XXXX"
              autoFocus
              inputProps={{ maxLength: 19 }}
              error={!!error && error.includes('Số thẻ')}
              helperText={error && error.includes('Số thẻ') ? error : ''}
            />
            <TextField
              fullWidth
              label="Tên chủ thẻ"
              name="cardHolder"
              value={paymentInfo.cardHolder}
              onChange={handlePaymentInfoChange}
              sx={{ mb: 2 }}
              error={!!error && error.includes('tên chủ thẻ')}
              helperText={error && error.includes('tên chủ thẻ') ? error : ''}
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
                  error={!!error && error.includes('Ngày hết hạn')}
                  helperText={error && error.includes('Ngày hết hạn') ? error : ''}
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
                  inputProps={{ maxLength: 4 }}
                  error={!!error && error.includes('CVV')}
                  helperText={error && error.includes('CVV') ? error : ''}
                />
              </Grid>
            </Grid>
          </>
        );
      case 'momo':
        return (
          <TextField
            fullWidth
            label="Số điện thoại MoMo"
            name="phoneNumber"
            value={paymentInfo.phoneNumber || ''}
            onChange={handlePaymentInfoChange}
            sx={{ mt: 2 }}
            error={!!error && error.includes('MoMo')}
            helperText={error && error.includes('MoMo') ? error : ''}
          />
        );
      case 'vnpay':
        return (
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Chọn ngân hàng</InputLabel>
            <Select
              name="bankCode"
              value={paymentInfo.bankCode || ''}
              onChange={handlePaymentInfoChange}
              label="Chọn ngân hàng"
              error={!!error && error.includes('ngân hàng')}
            >
              <MenuItem value="VCB">Vietcombank</MenuItem>
              <MenuItem value="TCB">Techcombank</MenuItem>
              <MenuItem value="MB">MB Bank</MenuItem>
              <MenuItem value="ACB">ACB</MenuItem>
            </Select>
            {error && error.includes('ngân hàng') && (
              <Typography color="error" variant="caption">{error}</Typography>
            )}
          </FormControl>
        );
      default:
        return null;
    }
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

          {renderPaymentMethodFields()}

          {error && !error.includes('Số thẻ') && !error.includes('tên chủ thẻ') && 
           !error.includes('Ngày hết hạn') && !error.includes('CVV') && 
           !error.includes('MoMo') && !error.includes('ngân hàng') && (
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
