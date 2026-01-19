import { memo, useState } from "react";
import Image from "next/image";
import Modal from "../Modal";

interface ImageCellProps {
  itemKeyValue: string;
  isQuickLook?: boolean;
}

export const ImageCell: React.FC<ImageCellProps> = memo(
  ({ itemKeyValue, isQuickLook }) => {
    const [isShowPreview, setIsShowPreview] = useState(false);

    return (
      <>
        <div className="flex justify-center items-center w-full">
          <Image
            src={itemKeyValue}
            width={300}
            height={300}
            alt="empty cart"
            onClick={() => setIsShowPreview(true)}
            className="w-24 object-cover rounded-sm cursor-pointer"
          />
        </div>

        {isQuickLook && isShowPreview && (
          <Modal
            isOpen={isShowPreview}
            onCancel={() => setIsShowPreview(false)}
            title=" Quick Look"
            isShowFooter={false}
            className="w-[600px]"
          >
            <Image
              src={itemKeyValue}
              width={400}
              height={400}
              alt="empty-cart"
              className="w-auto min-w-[400px] h-2/3 mx-auto object-contain"
            />
          </Modal>
        )}
      </>
    );
  }
);
