// The exceptions extension posthog.captureException needs. The slim build ships
// without one (posthog-js lib/src/posthog-core.js: "For the slim bundle, these
// remain undefined until _initExtensions sets them from config", and
// captureException returns early without it), and PostHog's own class weighs
// 84 KB gzipped. This is its core: the same @posthog/core ErrorPropertiesBuilder,
// coercers and stack parser (lib/src/posthog-exceptions.js
// buildErrorPropertiesBuilder), about 5 KB gzipped, loaded with posthog-js after
// the first paint. It leaves out what needs remote config (suppression rules),
// exception steps and extension filtering, which errors.js does before capture.
// analytics.js passes it to posthog.init as __extensionClasses.exceptions.

import {
  DOMExceptionCoercer,
  ErrorCoercer,
  ErrorEventCoercer,
  ErrorPropertiesBuilder,
  EventCoercer,
  ObjectCoercer,
  PrimitiveCoercer,
  PromiseRejectionEventCoercer,
  StringCoercer,
  createDefaultStackParser,
  getInjectedReleaseId,
} from '@posthog/core/error-tracking';

export class PostHogExceptions {
  constructor(instance) {
    this.instance = instance;
    this.builder = new ErrorPropertiesBuilder(
      [
        new DOMExceptionCoercer(),
        new PromiseRejectionEventCoercer(),
        new ErrorEventCoercer(),
        new ErrorCoercer(),
        new EventCoercer(),
        new ObjectCoercer(),
        new StringCoercer(),
        new PrimitiveCoercer(),
      ],
      createDefaultStackParser(),
    );
  }

  /** $exception_list (type, value, mechanism, stack frames with source map chunk ids) and $exception_level. */
  buildProperties(input, metadata) {
    return this.builder.buildFromUnknown(input, {
      syntheticException: metadata?.syntheticException,
      mechanism: { handled: metadata?.handled },
    });
  }

  /** Sends the $exception the way PostHog's own extension does: whole, in its own batch. */
  sendExceptionEvent(properties) {
    // Set by posthog-cli sourcemap inject, when the build ran it.
    const releaseId = getInjectedReleaseId();
    return this.instance.capture('$exception', releaseId ? { ...properties, $release_id: releaseId } : properties, {
      _noTruncate: true,
      _batchKey: 'exceptionEvent',
      _originatedFromCaptureException: true,
    });
  }

  // posthog.set_config calls this; nothing here reads config.
  onConfigChange() {}

  // posthog.addExceptionStep (breadcrumbs) calls this; the site records none.
  addExceptionStep() {}
}
