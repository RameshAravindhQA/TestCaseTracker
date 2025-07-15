import { ProfilePicture } from '../components/ProfilePicture';
import { useSound } from '../hooks/useSound';
import { WelcomeDialog } from '../components/WelcomeDialog';

const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { playSound } = useSound();

<ProfilePicture
                  src={user?.profilePicture}
                  alt={user?.name || 'User'}
                  size="sm"
                  showUpload={true}
                  onImageUpload={(file) => {
                    console.log('Profile image uploaded:', file);
                    playSound('success');
                  }}
                  onLottieSelect={(lottieData) => {
                    console.log('Profile Lottie selected:', lottieData);
                    playSound('success');
                  }}
                />