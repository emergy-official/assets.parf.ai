import { useRef, useState } from 'react';
import { navigate } from 'astro:transitions/client';
import ProcessRequest from './ProcessRequest';
import { useStore } from '@nanostores/react';
import { imagesToProcess } from '~/stores/stores';

export default function Request() {
  const $imagesToProcess = useStore(imagesToProcess);

  return (
    <div className=''>
      {$imagesToProcess.map((e, i) => (
        <section key={i} className="relative not-prose">
          <div className="absolute inset-0 pointer-events-none"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
            <div className="pointer-events-none"></div>
            <div className="">
              <ProcessRequest item={e} itemsSet={imagesToProcess} items={$imagesToProcess} expand={i == $imagesToProcess.length - 1} />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
