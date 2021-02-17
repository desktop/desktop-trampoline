  {
    'targets': [
      {
        'target_name': 'desktop-trampoline',
        'type': 'executable',
        'sources': [
          'src/desktop-trampoline.c',
          'src/socket.c'
        ],
        'include_dirs': [
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
          '-Werror=format-security'
        ],
        'ldflags!': [
          '-z relro',
          '-z now'
        ],
        'conditions': [
          ['OS=="win"', {
            'defines': [ 'WINDOWS' ],
            'link_settings': {
              'libraries': [ 'Ws2_32.lib' ]
            }
          }]
        ]
      },
    ],
  }
