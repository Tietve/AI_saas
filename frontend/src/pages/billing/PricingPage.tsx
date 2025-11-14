import { useState } from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Button, Chip, CircularProgress } from '@mui/material';
import { Check } from 'lucide-react';
import { usePlans, useSubscription, useCreateSubscription } from '@/features/billing/hooks/useBilling';
import { useToast } from '@/shared/ui';
import type { Plan } from '@/features/billing/api/types';

export function PricingPage() {
  const { data: plans = [], isLoading: isLoadingPlans } = usePlans();
  const { data: subscription } = useSubscription();
  const createSubscriptionMutation = useCreateSubscription();
  const { showSuccess, showError } = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const handleSubscribe = async (plan: Plan) => {
    if (plan.tier === 'free') {
      showError('You are already on the free plan');
      return;
    }

    setSelectedPlanId(plan.id);
    try {
      await createSubscriptionMutation.mutateAsync({
        planId: plan.id,
      });
      showSuccess(`Successfully subscribed to ${plan.name}!`);
    } catch (error: any) {
      console.error('Subscription error:', error);
      showError(error.response?.data?.message || 'Failed to create subscription');
    } finally {
      setSelectedPlanId(null);
    }
  };

  const formatPrice = (price: number, currency: string, interval: string) => {
    if (price === 0) return 'Free';
    return `$${price}/${interval}`;
  };

  const isCurrentPlan = (planTier: string) => {
    return subscription?.tier === planTier;
  };

  if (isLoadingPlans) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 8 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box textAlign="center" mb={6}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Choose Your Plan
          </Typography>
          <Typography variant="h6" color="text.secondary" mb={4}>
            Start for free, upgrade when you need more
          </Typography>
        </Box>

        {/* Pricing Cards */}
        <Grid container spacing={4} justifyContent="center">
          {plans.map((plan) => {
            const isCurrent = isCurrentPlan(plan.tier);
            const isPopular = plan.popular;
            const isSubscribing = selectedPlanId === plan.id;

            return (
              <Grid item xs={12} md={4} key={plan.id}>
                <Card
                  elevation={isPopular ? 8 : 2}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    border: isPopular ? '2px solid' : '1px solid',
                    borderColor: isPopular ? 'primary.main' : 'divider',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 6,
                    },
                  }}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <Chip
                      label="Most Popular"
                      color="primary"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        fontWeight: 'bold',
                      }}
                    />
                  )}

                  <CardContent sx={{ flexGrow: 1, p: 4 }}>
                    {/* Plan Name */}
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      {plan.name}
                    </Typography>

                    {/* Price */}
                    <Box mb={3}>
                      <Typography variant="h3" fontWeight="bold" component="span">
                        {formatPrice(plan.price, plan.currency, plan.interval)}
                      </Typography>
                    </Box>

                    {/* Token Limit */}
                    <Typography variant="body2" color="text.secondary" mb={3}>
                      {plan.tokenLimit.toLocaleString()} tokens/month
                    </Typography>

                    {/* Features */}
                    <Box mb={3}>
                      {plan.features.map((feature, index) => (
                        <Box
                          key={index}
                          display="flex"
                          alignItems="flex-start"
                          mb={1.5}
                        >
                          <Check
                            size={20}
                            style={{
                              color: isPopular ? '#1976d2' : '#666',
                              marginRight: '8px',
                              marginTop: '2px',
                              flexShrink: 0,
                            }}
                          />
                          <Typography variant="body2">{feature}</Typography>
                        </Box>
                      ))}
                    </Box>

                    {/* Subscribe Button */}
                    <Button
                      fullWidth
                      variant={isCurrent ? 'outlined' : isPopular ? 'contained' : 'outlined'}
                      size="large"
                      disabled={isCurrent || isSubscribing}
                      onClick={() => handleSubscribe(plan)}
                      sx={{
                        mt: 'auto',
                        py: 1.5,
                        fontWeight: 'bold',
                      }}
                    >
                      {isSubscribing ? (
                        <CircularProgress size={24} />
                      ) : isCurrent ? (
                        'Current Plan'
                      ) : plan.tier === 'free' ? (
                        'Get Started'
                      ) : (
                        'Subscribe'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* FAQ or Additional Info */}
        <Box mt={8} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            All plans include access to our AI chat platform. Cancel anytime.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
