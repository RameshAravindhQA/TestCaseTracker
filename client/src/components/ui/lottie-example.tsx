
import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';

export const LottieExample = () => {
  const [maleAvatar, setMaleAvatar] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Method 1: Load animation data for animationData prop
    const loadAnimationData = async () => {
      try {
        const response = await fetch('/lottie/male-avatar.json');
        if (response.ok) {
          const data = await response.json();
          setMaleAvatar(data);
        }
      } catch (error) {
        console.error('Failed to load animation:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnimationData();
  }, []);

  if (loading) {
    return <div>Loading animation...</div>;
  }

  return (
    <div className="flex space-x-4">
      {/* Method 1: Using animationData prop with pre-loaded JSON */}
      <div style={{ width: 100, height: 100 }}>
        {maleAvatar && (
          <Lottie 
            animationData={maleAvatar}
            loop
            autoplay
            style={{ width: 100, height: 100 }}
          />
        )}
      </div>

      {/* Method 2: Using your custom LottieAnimation component */}
      <div style={{ width: 100, height: 100 }}>
        <LottieAnimation
          path="/lottie/male-avatar.json"
          width={100}
          height={100}
          loop
          autoplay
        />
      </div>
    </div>
  );
};
