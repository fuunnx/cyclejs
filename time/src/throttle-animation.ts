import xs, {Stream} from 'xstream';
import sampleCombine from 'xstream/extra/sampleCombine';
import {adapt} from '@cycle/run/lib/adapt';

function makeThrottleAnimation(
  timeSource: any,
  schedule: any,
  currentTime: () => number
) {
  return function throttleAnimation<T>(inputStream: Stream<T>): Stream<T> {
    const source = timeSource();
    const stream = xs.fromObservable(inputStream);

    const throttledStream = xs.create<T>({
      start(listener) {
        let lastValue: any = null;
        let emittedLastValue = true;
        const frame$ = xs.fromObservable(source.animationFrames());

        const frameListener = {
          next(event: any) {
            if (!emittedLastValue) {
              listener.next(lastValue);
              emittedLastValue = true;
            }
          },
        };

        stream.addListener({
          next(event: T) {
            lastValue = event;
            emittedLastValue = false;
          },

          error(err: Error) {
            listener.error(err);
          },

          complete() {
            frame$.removeListener(frameListener);
            listener.complete();
          },
        };

        stream.addListener(animationListener);
        frame$.addListener(frameListener);
      },

      stop() {
        stream.shamefullySendComplete();
      },
    });

    return adapt(throttledStream);
  };
}

export {makeThrottleAnimation};
