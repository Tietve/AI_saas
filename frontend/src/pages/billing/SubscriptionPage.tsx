import { Box, Container, Typography, Card, CardContent, Button, Chip, Grid, CircularProgress, Divider } from '@mui/material';
import { CreditCard, Calendar, TrendingUp } from 'lucide-react';
import { useSubscription, useUsage, usePaymentHistory, useCancelSubscription } from '@/features/billing/hooks/useBilling';
import { useToast, Spinner } from '@/shared/ui';
import { useNavigate } from 'react-router-dom';

export function SubscriptionPage() {
  const { data: subscription, isLoading: isLoadingSubscription } = useSubscription();
  const { data: usage } = useUsage();
  const { data: payments = [], isLoading: isLoadingPayments } = usePaymentHistory();
  const cancelMutation = useCancelSubscription();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will still have access until the end of your billing period.')) {
      return;
    }

    try {
      await cancelMutation.mutateAsync();
      showSuccess('Subscription cancelled successfully');
    } catch (error: any) {
      console.error('Cancel error:', error);
      showError(error.response?.data?.message || 'Failed to cancel subscription');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'cancelled':
        return 'warning';
      case 'past_due':
        return 'error';
      default:
        return 'default';
    }
  };

  if (isLoadingSubscription) {
    return <Spinner fullScreen message="Loading subscription..." />;
  }

  if (!subscription) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h5" gutterBottom>
              No Active Subscription
            </Typography>
            <Typography color="text.secondary" mb={3}>
              You are currently on the free plan. Upgrade to unlock more features!
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/pricing')}
            >
              View Pricing Plans
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Subscription & Billing
      </Typography>

      <Grid container spacing={3} mt={2}>
        {/* Current Subscription Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Current Plan
                </Typography>
                <Chip
                  label={subscription.status.toUpperCase()}
                  color={getStatusColor(subscription.status) as any}
                  size="small"
                />
              </Box>

              <Typography variant="h4" color="primary" gutterBottom>
                {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)}
              </Typography>

              <Box mt={3} display="flex" alignItems="center" gap={1} mb={2}>
                <Calendar size={18} />
                <Typography variant="body2" color="text.secondary">
                  Current period: {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                </Typography>
              </Box>

              {subscription.cancelAtPeriodEnd && (
                <Box
                  sx={{
                    bgcolor: 'warning.light',
                    p: 2,
                    borderRadius: 1,
                    mb: 2,
                  }}
                >
                  <Typography variant="body2" fontWeight="bold">
                    Subscription will be cancelled at the end of the billing period
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Box display="flex" gap={2}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/pricing')}
                >
                  Change Plan
                </Button>
                {!subscription.cancelAtPeriodEnd && subscription.tier !== 'free' && (
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    onClick={handleCancelSubscription}
                    disabled={cancelMutation.isPending}
                  >
                    {cancelMutation.isPending ? <CircularProgress size={20} /> : 'Cancel'}
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Usage Card */}
        {usage && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6" fontWeight="bold">
                    Token Usage
                  </Typography>
                  <TrendingUp size={24} />
                </Box>

                <Typography variant="h4" gutterBottom>
                  {usage.tokensUsed.toLocaleString()} / {usage.tokenLimit.toLocaleString()}
                </Typography>

                <Box
                  sx={{
                    width: '100%',
                    height: 8,
                    bgcolor: 'grey.200',
                    borderRadius: 1,
                    overflow: 'hidden',
                    my: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: `${Math.min(usage.percentUsed, 100)}%`,
                      height: '100%',
                      bgcolor: usage.percentUsed > 90 ? 'error.main' : 'primary.main',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary">
                  {usage.percentUsed.toFixed(1)}% used • Resets on {formatDate(usage.resetDate)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Payment History */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <CreditCard size={24} />
                <Typography variant="h6" fontWeight="bold">
                  Payment History
                </Typography>
              </Box>

              {isLoadingPayments ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : payments.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  No payment history available
                </Typography>
              ) : (
                <Box>
                  {payments.map((payment) => (
                    <Box
                      key={payment.id}
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      py={2}
                      borderBottom="1px solid"
                      borderColor="divider"
                    >
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          ${payment.amount.toFixed(2)} {payment.currency.toUpperCase()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(payment.createdAt)}
                        </Typography>
                      </Box>
                      <Chip
                        label={payment.status.toUpperCase()}
                        color={payment.status === 'succeeded' ? 'success' : payment.status === 'failed' ? 'error' : 'default'}
                        size="small"
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
