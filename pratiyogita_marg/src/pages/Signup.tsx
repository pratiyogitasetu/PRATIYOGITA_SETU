import { useNavigate } from 'react-router-dom';
import AuthModal from '@/components/AuthModal';

const Signup = () => {
  const navigate = useNavigate();

  return (
    <AuthModal
      isOpen={true}
      onClose={() => navigate('/')}
      initialMode="signup"
    />
  );
};

export default Signup;
