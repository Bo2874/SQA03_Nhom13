import SvgIcon from "../ui/SvgIcon";

const Messenger = ({ ...rest }) => (
  <SvgIcon
    {...rest}
    name="messenger"
    width="24px"
    height="24px"
    className="p-1 bg-blue-800 rounded-full"
  />
);

export default Messenger;
