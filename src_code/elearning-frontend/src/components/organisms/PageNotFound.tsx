import Button from "@/components/ui/Button";
import Link from "next/link";
import Image from "next/image";
import { PATH } from "@/constants/paths";

const PageNotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center mb-10 px-9">
      <Image
        src="/images/404.jpeg"
        alt="404 Not Found"
        width={800}
        height={450}
        sizes="(max-width: 768px) 100vw, 50vw"
        priority
        className="w-full max-w-screen-sm mb-6"
      />

      <Link href={PATH.HOME}>
        <Button className="md:-mt-0 hover:opacity-80 px-6 text-base rounded-lg shadow-lg">
          Trở về trang chủ
        </Button>
      </Link>
    </div>
  );
};

export default PageNotFound;
