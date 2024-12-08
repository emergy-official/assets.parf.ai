import { useRef, useState } from 'react';
import { navigate } from 'astro:transitions/client';
import { useStore } from '@nanostores/react';
import { imagesToProcess } from '~/stores/stores';

export default function HomeSearchForm() {
  const [loading, setLoading] = useState(false);
  const searchInputRef: any = useRef(null);
  const $imagesToProcess = useStore(imagesToProcess);

  const handleSubmit = () => {
    if (!searchInputRef?.current?.value) {
      return;
    }
    imagesToProcess.set([
      ...$imagesToProcess,
      {
        request: searchInputRef?.current?.value,
      },
    ]);
    // setLoading(true);
  };

  return (
    <>
      <input
        onKeyPress={(event) => {
          if (event.key === 'Enter') {
            handleSubmit();
          }
        }}
        ref={searchInputRef}
        type="text"
        name="q"
        placeholder="A car, cartoon design"
        className="px-8 py-4 border rounded-full rounded-r-none border-r-0"
      />
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="inset-y-0 px-8 py-4 bg-[#df6d0c] text-white rounded-full rounded-l-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {!loading && 'Add to the world'}
        {loading && (
          <div className="flex justify-center">
            <svg
              style={{ animation: 'spin 1s linear infinite' }}
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto icon icon-tabler icons-tabler-outline icon-tabler-loader-2"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M12 3a9 9 0 1 0 9 9" />
            </svg>
          </div>
        )}
      </button>
    </>
  );
}
