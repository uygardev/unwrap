// Registers a macOS services provider so the app can appear in the right-click > Services menu.
// The menu items themselves are declared under NSServices in Info.plist (see package.json).
#import <AppKit/AppKit.h>
#include <node_api.h>
#include <string>

struct ServiceRequest {
  std::string userData;
  std::string text;
};

static napi_threadsafe_function handler = nullptr;

// Runs on the JavaScript thread: handler(userData, text).
static void CallHandler(napi_env env, napi_value callback, void *context, void *data) {
  ServiceRequest *request = static_cast<ServiceRequest *>(data);
  if (env != nullptr && callback != nullptr) {
    napi_value undefined, argv[2];
    napi_get_undefined(env, &undefined);
    napi_create_string_utf8(env, request->userData.c_str(), request->userData.size(), &argv[0]);
    napi_create_string_utf8(env, request->text.c_str(), request->text.size(), &argv[1]);
    napi_call_function(env, undefined, callback, 2, argv, nullptr);
  }
  delete request;
}

@interface PWLBServiceProvider : NSObject
@end

@implementation PWLBServiceProvider
// Matches NSMessage = "handleService" in Info.plist.
- (void)handleService:(NSPasteboard *)pboard userData:(NSString *)userData error:(NSString **)error {
  NSString *text = [pboard stringForType:NSPasteboardTypeString];
  if (text.length == 0 || handler == nullptr) {
    if (error) *error = @"No text was selected.";
    return;
  }
  ServiceRequest *request = new ServiceRequest{userData ? userData.UTF8String : "", text.UTF8String};
  napi_call_threadsafe_function(handler, request, napi_tsfn_nonblocking);
}
@end

static PWLBServiceProvider *provider = nil;

// register(portName, handler): portName must match NSPortName in Info.plist.
static napi_value Register(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value args[2];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  if (argc < 2) {
    napi_throw_type_error(env, nullptr, "register(portName, handler) expects two arguments");
    return nullptr;
  }

  char port[256];
  size_t length = 0;
  if (napi_get_value_string_utf8(env, args[0], port, sizeof port, &length) != napi_ok) {
    napi_throw_type_error(env, nullptr, "portName must be a string");
    return nullptr;
  }

  if (handler != nullptr) napi_release_threadsafe_function(handler, napi_tsfn_release);
  napi_value name;
  napi_create_string_utf8(env, "macos-services", NAPI_AUTO_LENGTH, &name);
  if (napi_create_threadsafe_function(env, args[1], nullptr, name, 0, 1, nullptr, nullptr, nullptr,
                                      CallHandler, &handler) != napi_ok) {
    napi_throw_error(env, nullptr, "Could not create the service handler");
    return nullptr;
  }
  // Do not keep the process alive just for the services provider.
  napi_unref_threadsafe_function(env, handler);

  if (provider == nil) provider = [PWLBServiceProvider new];
  [NSApp setServicesProvider:provider];
  NSRegisterServicesProvider(provider, [NSString stringWithUTF8String:port]);
  NSUpdateDynamicServices();
  return nullptr;
}

NAPI_MODULE_INIT() {
  napi_value fn;
  napi_create_function(env, "register", NAPI_AUTO_LENGTH, Register, nullptr, &fn);
  napi_set_named_property(env, exports, "register", fn);
  return exports;
}
