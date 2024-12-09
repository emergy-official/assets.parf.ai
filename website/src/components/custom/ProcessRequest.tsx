import { useEffect, useRef, useState } from 'react';
import { navigate } from 'astro:transitions/client';
import { Loader } from '../ui/icons/Loader';
import { addNextObject } from './World';
import { useStore } from '@nanostores/react';
import { scene, draggableObjects } from '~/stores/stores';
import { LoadIcon } from '../ui/icons/LoadIcon';

// function delay(ms: number): Promise<void> {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

const generateImage = async (item, items, itemsSet) => {
  try {
    const startTime = Date.now();
    const response = await fetch('https://dev.assets.parf.ai/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: item.request }),
    });

    const res = await response.json();
    item.timeGeneratedImage = (Date.now() - startTime) / 1000;
    item.generatedImage = `data:image/png;base64,${res.base64}`;
    itemsSet.set([...items]);
  } catch (error) {
    throw new Error('Network error: ' + error);
  }
};
const removeBackground = async (item, items, itemsSet) => {
  try {
    const startTime = Date.now();

    const response = await fetch('https://dev.assets.parf.ai/api/remove-background', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64: item.generatedImage.replace('data:image/png;base64,', '') }),
    });

    const res = await response.json();
    item.timeRemoveBackgroundImage = (Date.now() - startTime) / 1000;

    item.removeBackgroundImage = `data:image/png;base64,${res.base64}`;
    itemsSet.set([...items]);
  } catch (error) {
    throw new Error('Network error: ' + error);
  }
};
const createMesh = async (item, items, itemsSet) => {
  try {
    const startTime = Date.now();

    const response = await fetch('https://dev.assets.parf.ai/api/generate-mesh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64: item.removeBackgroundImage.replace('data:image/png;base64,', '') }),
    });

    const res = await response.json();
    item.meshImage = `data:image/png;base64,${res.mvsImage}`;
    item.timeMeshImage = (Date.now() - startTime) / 1000;
    item.model3d = res.obj3DUrl;
    itemsSet.set([...items]);
  } catch (error) {
    throw new Error('Network error: ' + error);
  }
};

export default function ProcessRequest({ item, expand, itemsSet, items }) {
  const [isOpen, setIsOpen] = useState(expand);
  const scrollRef = useRef<HTMLDivElement | null>(null); // Create a ref for the scrolling target

  const $scene = useStore(scene);
  const $draggableObjects = useStore(draggableObjects, $scene);

  useEffect(() => {
    setIsOpen(expand);
  }, [expand]);

  useEffect(() => {
    console.log('Test 1');
    if (!item.generatedImage) {
      // Generate Image
      generateImage(item, items, itemsSet);
    } else if (!item.removeBackgroundImage) {
      // Remove Background Image
      removeBackground(item, items, itemsSet);
    } else if (!item.meshImage) {
      // Create mesh Image
      createMesh(item, items, itemsSet);
    } else if (item.model3d && !item.ready) {
      // Add model to the world
      addNextObject(item, $draggableObjects, $scene, items, itemsSet);
    }
    if (item.ready) {
      console.log('Scrolling');
      if (typeof window !== 'undefined') {
        console.log('Scrolling!');
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth',
        });
      }
    }
  }, [item.generatedImage, item.removeBackgroundImage, item.meshImage, item.model3d, item.ready]);

  return (
    <div
      ref={scrollRef}
      className="mx-auto px-4 border p-4 rounded-lg mb-4 cursor-pointer"
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="flex items-center justify-between ">
        <h1 className="text-2xl font-bold cursor-pointer">{item.request}</h1>
        <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none">
          {isOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>
      </div>
      {isOpen && (
        <div className="flex flex-wrap">
          <div className="flex flex-col items-center w-1/3 p-4">
            <h2 className="text-xl font-semibold">
              Generating image {item.timeGeneratedImage ? `(${item.timeGeneratedImage?.toFixed(2)} sec)` : ''}
            </h2>
            <div className="bg-gray-200 p-5 rounded-lg w-full">
              {!item.generatedImage ? (
                <Loader />
              ) : (
                <img className="h-40 rounded-md bg-cover bg-center mx-auto" src={item.generatedImage} />
              )}
            </div>
          </div>
          <div className="flex flex-col items-center w-1/3 p-4">
            <h2 className="text-xl font-semibold">
              Removing background{' '}
              {item.timeRemoveBackgroundImage ? `(${item.timeRemoveBackgroundImage?.toFixed(2)} sec)` : ''}
            </h2>
            <div className="bg-gray-200 p-5 rounded-lg w-full">
              {!item.generatedImage ? <div className="h-40 rounded-md bg-cover bg-center"></div> : ''}
              {item.generatedImage && !item.removeBackgroundImage ? <Loader /> : ''}
              {item.removeBackgroundImage ? (
                <img className="h-40 rounded-md bg-cover bg-center mx-auto" src={item.removeBackgroundImage} />
              ) : (
                ''
              )}
              {/* {item.removeBackgroundImage ? <div className="h-40 rounded-md bg-cover bg-center">Done</div> : ''} */}
            </div>
          </div>
          <div className="flex flex-col items-center w-1/3 p-4">
            <h2 className="text-xl font-semibold flex  items-center">
              Creating mesh {item.meshImage && !item.ready ? <>(downloading {<LoadIcon />})</> : ''}
              {item.timeMeshAndDownload ? `(${item.timeMeshAndDownload?.toFixed(2)} sec)` : ''}
            </h2>
            <div className="bg-gray-200 p-5 rounded-lg w-full">
              {!item.removeBackgroundImage ? <div className="h-40 rounded-md bg-cover bg-center"></div> : ''}
              {item.removeBackgroundImage && !item.meshImage ? <Loader /> : ''}
              {item.meshImage ? (
                <img className="h-40 rounded-md bg-cover bg-center mx-auto" src={item.meshImage} />
              ) : (
                ''
              )}{' '}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
