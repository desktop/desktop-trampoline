  {
    'targets': [
      {
        'target_name': 'desktop-trampoline',
        'defines': [
          "NAPI_VERSION=<(napi_build_version)",
        ],
        'type': 'executable',
        'sources': [
          'src/desktop-trampoline.c',
          'src/socket.c'
        ],
        'include_dirs': [
          '<!(node -p "require(\'node-addon-api\').include_dir")',
          'include'
        ],
        'xcode_settings': {
          'OTHER_CFLAGS': [
            '-Wall',
            '-Werror',
            '-Werror=format-security',
            '-fPIC',
            '-D_FORTIFY_SOURCE=1',
            '-fstack-protector-strong'
          ]
        },
        'cflags!': [
          '-Wall',
          '-Werror',
          '-fPIC',
          '-pie',
          '-D_FORTIFY_SOURCE=1',
          '-fstack-protector-strong',
          '-Werror=format-security',
          '-fno-exceptions'
        ],
        'cflags_cc!': [ '-fno-exceptions' ],
        'ldflags!': [
          '-z relro',
          '-z now'
        ],
        'msvs_settings': {
          'VCCLCompilerTool': { 'ExceptionHandling': 1 },
        },
        'conditions': [
          ['OS=="win"', {
            'defines': [ 'WINDOWS' ],
            'link_settings': {
              'libraries': [ 'Ws2_32.lib' ]
            }
          }]
        ]
      },
      {
        'target_name': 'ssh-wrapper',
        'defines': [
          "NAPI_VERSION=<(napi_build_version)",
        ],
        'type': 'executable',
        'sources': [
          'src/ssh-wrapper.c'
        ],
        'include_dirs': [
          '<!(node -p "require(\'node-addon-api\').include_dir")',
          'include'
        ],
        'xcode_settings': {
          'OTHER_CFLAGS': [
            '-Wall',
            '-Werror',
            '-Werror=format-security',
            '-fPIC',
            '-D_FORTIFY_SOURCE=1',
            '-fstack-protector-strong'
          ]
        },
        'cflags!': [
          '-Wall',
          '-Werror',
          '-fPIC',
          '-pie',
          '-D_FORTIFY_SOURCE=1',
          '-fstack-protector-strong',
          '-Werror=format-security',
          '-fno-exceptions'
        ],
        'cflags_cc!': [ '-fno-exceptions' ],
        'ldflags!': [
          '-z relro',
          '-z now'
        ],
        'msvs_settings': {
          'VCCLCompilerTool': { 'ExceptionHandling': 1 },
        },
        'conditions': [
          # For now only build it for macOS, since it's not needed on Windows
          ['OS=="win"', {
            'defines': [ 'WINDOWS' ],
          }]
        ]
      },
    ],
  }
