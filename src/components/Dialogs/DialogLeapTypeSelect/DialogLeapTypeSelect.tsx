import * as Dialog from '@radix-ui/react-dialog';
import {ReactNode, useContext, useState} from 'react';
import {LangContext} from '@/providers/LangProvider/LangProvider';
import TokenIcon from '@/components/TokenIcon/TokenIcon';
import DialogXudtLeapToLayer1CanSelectToken from '@/components/Dialogs/DialogLeapXudtToLayer1/DialogXudtLeapToLayer1CanSelectToken';
import DialogLeapXudtToLayer2CanSelectToken from '@/components/Dialogs/DialogLeapXudtToLayer2/DialogLeapXudtToLayer2CanSelectToken';

export default function DialogLeapTypeSelect({children, className = ''}: {children: ReactNode; className?: string}) {
  const [open, setOpen] = useState(false);
  const {lang} = useContext(LangContext);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className={className}>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-[rgba(0,0,0,0.6)] z-40 data-[state=open]:animate-overlayShow fixed inset-0" />
        <Dialog.Content
          onPointerDownOutside={e => {
            e.preventDefault();
          }}
          className="data-[state=open]:animate-contentShow z-50 fixed top-[50%] left-[50%] max-h-[85vh]  max-w-[90vw] w-full translate-x-[-50%] md:max-w-[450px] translate-y-[-50%] rounded-xl bg-white p-4 shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none"
        >
          <div className="flex flex-row justify-between items-center mb-4">
            <div className="font-semibold text-2xl">{lang['Leap to']}</div>
            <div
              onClick={e => {
                setOpen(false);
              }}
              className="flex flex-row items-center justify-center text-xl cursor-pointer h-[24px] w-[24px] rounded-full bg-gray-100"
            >
              <i className="uil-times text-gray-500" />
            </div>
          </div>

          <DialogXudtLeapToLayer1CanSelectToken className="w-full">
            <div className="bg-gray-50 rounded-lg py-3 px-4 cursor-pointer mb-4 flex flex-row items-center justify-between">
              <div className="flex flex-row items-center">
                <TokenIcon symbol="btc" size={26} />
                <div>BTC</div>
              </div>
              <i className="uil-angle-right text-3xl font-semibold" />
            </div>
          </DialogXudtLeapToLayer1CanSelectToken>
          <DialogLeapXudtToLayer2CanSelectToken className="w-full">
            <div className="bg-gray-50 rounded-lg py-3 px-4 cursor-pointer mb-4 flex flex-row items-center justify-between">
              <div className="flex flex-row items-center">
                <TokenIcon symbol="ckb" size={26} />
                <div>CKB</div>
              </div>
              <i className="uil-angle-right text-3xl font-semibold" />
            </div>
          </DialogLeapXudtToLayer2CanSelectToken>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
