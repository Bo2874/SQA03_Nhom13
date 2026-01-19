import { useSwipeable, SwipeableProps } from "react-swipeable";

interface SwipeHandlers {
  onSwipedLeft: () => void;
  onSwipedRight: () => void;
}

const useCustomSwipeable = ({ onSwipedLeft, onSwipedRight }: SwipeHandlers) => {
  const config: Partial<SwipeableProps> = {
    onSwipedLeft,
    onSwipedRight,
  };

  return useSwipeable(config);
};

export default useCustomSwipeable;
