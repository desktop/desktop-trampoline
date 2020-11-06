  {
    'targets': [
      {
        'target_name': 'askpass-trampoline',
        'type': 'executable',
        'sources': [
          'src/askpass-trampoline.c'
        ],
        'conditions': [
          ['OS=="win"', {
            'defines': [ 'WINDOWS' ],
            'link_settings': {
              'libraries': [ 'Shlwapi.lib' ]
            }
          }]
        ]
      },
    ],
  }
