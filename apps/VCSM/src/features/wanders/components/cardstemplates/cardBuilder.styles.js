export const labelBase =
  "block text-[13px] font-semibold tracking-[0.01em] text-gray-900 mb-1.5";

export const inputBase =
  "w-full rounded-2xl border px-4 py-3 text-[15px] leading-6 " +
  "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 " +
  "shadow-[0_1px_0_0_rgba(0,0,0,0.04)] " +
  "transition duration-150 " +
  "hover:border-gray-300 " +
  "focus:outline-none focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-black/10 " +
  "disabled:bg-gray-50 disabled:text-gray-500 disabled:opacity-70 disabled:cursor-not-allowed";

export const textareaBase = inputBase + " align-top resize-none min-h-[120px]";

export const selectBase =
  inputBase +
  " appearance-none pr-10 " +
  "bg-[linear-gradient(45deg,transparent_50%,rgba(0,0,0,0.55)_50%),linear-gradient(135deg,rgba(0,0,0,0.55)_50%,transparent_50%)] " +
  "bg-[position:calc(100%-18px)_calc(50%+1px),calc(100%-13px)_calc(50%+1px)] " +
  "bg-[size:5px_5px,5px_5px] bg-no-repeat";

export const primaryBtn =
  "w-full rounded-2xl bg-black text-white py-3 text-sm font-semibold " +
  "shadow-[0_12px_30px_-18px_rgba(0,0,0,0.6)] " +
  "transition active:scale-[0.99] hover:bg-black/90 " +
  "focus:outline-none focus:ring-4 focus:ring-black/15 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

export const helperText = "mt-2 text-xs text-gray-500";
