{
  "targets": [
    {
      "target_name": "macos_services",
      "sources": ["services.mm"],
      "xcode_settings": {
        "CLANG_ENABLE_OBJC_ARC": "YES",
        "CLANG_CXX_LANGUAGE_STANDARD": "c++20",
        "MACOSX_DEPLOYMENT_TARGET": "12.0"
      },
      "link_settings": {
        "libraries": ["-framework AppKit"]
      }
    }
  ]
}
