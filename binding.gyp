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
        "xcode_settings": {
          'OTHER_CFLAGS': [
            '-Wall',
            '-Werror'
          ],
        },
        'cflags!': [
          '-Wall',
          '-Werror',
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
