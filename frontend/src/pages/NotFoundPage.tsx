import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Container } from '@mui/material';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';

/**
 * 404 Not Found Page
 * Custom branded error page for non-existent routes
 */
export function NotFoundPage() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate(ROUTES.CHAT);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        bgcolor: 'background.default',
        background: 'linear-gradient(135deg, var(--bg-main) 0%, var(--bg-secondary) 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'float 6s ease-in-out infinite',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          right: '10%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'float 8s ease-in-out infinite reverse',
        }}
      />

      <Container maxWidth="md">
        <Box
          sx={{
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* 404 Number with gradient */}
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '120px', sm: '160px', md: '200px' },
              fontWeight: 800,
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              mb: 2,
              lineHeight: 1,
              animation: 'fadeInScale 0.6s ease-out',
            }}
          >
            404
          </Typography>

          {/* Icon */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <Search
              size={64}
              color="var(--text-secondary)"
              style={{
                animation: 'bounce 2s ease-in-out infinite',
              }}
            />
          </Box>

          {/* Title */}
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              mb: 2,
              color: 'text.primary',
              animation: 'fadeIn 0.8s ease-out',
            }}
          >
            Page Not Found
          </Typography>

          {/* Description */}
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              mb: 4,
              maxWidth: '500px',
              mx: 'auto',
              lineHeight: 1.7,
              animation: 'fadeIn 1s ease-out',
            }}
          >
            The page you're looking for doesn't exist or has been moved.
            Don't worry, even the best explorers get lost sometimes!
          </Typography>

          {/* Action Buttons */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
              animation: 'fadeIn 1.2s ease-out',
            }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<Home size={20} />}
              onClick={handleGoHome}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.4)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px 0 rgba(99, 102, 241, 0.5)',
                },
              }}
            >
              Go to Home
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={<ArrowLeft size={20} />}
              onClick={handleGoBack}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                borderColor: 'var(--border-color)',
                color: 'text.primary',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  borderColor: 'primary.main',
                  bgcolor: 'rgba(99, 102, 241, 0.05)',
                },
              }}
            >
              Go Back
            </Button>
          </Box>

          {/* Helpful Links */}
          <Box
            sx={{
              mt: 6,
              pt: 4,
              borderTop: '1px solid',
              borderColor: 'divider',
              animation: 'fadeIn 1.4s ease-out',
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              Here are some helpful links instead:
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 3,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Button
                variant="text"
                size="small"
                onClick={() => navigate(ROUTES.CHAT)}
                sx={{
                  textTransform: 'none',
                  color: 'primary.main',
                  fontWeight: 600,
                  '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.05)' },
                }}
              >
                Chat
              </Button>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate(ROUTES.PLANS)}
                sx={{
                  textTransform: 'none',
                  color: 'primary.main',
                  fontWeight: 600,
                  '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.05)' },
                }}
              >
                Pricing
              </Button>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate(ROUTES.SUBSCRIPTION)}
                sx={{
                  textTransform: 'none',
                  color: 'primary.main',
                  fontWeight: 600,
                  '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.05)' },
                }}
              >
                Subscription
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes float {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-20px);
            }
          }

          @keyframes bounce {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }
        `}
      </style>
    </Box>
  );
}
