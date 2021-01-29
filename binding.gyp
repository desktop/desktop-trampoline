  {
    'targets': [
      {
        'target_name': 'desktop-trampoline',
        'type': 'executable',
        'sources': [
          'src/desktop-trampoline.c'
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
