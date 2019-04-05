  {
    'targets': [
      {
        'target_name': 'ask-pass-trampoline',
        'type': 'executable',
        'sources': [
          'src/ask-pass-trampoline.c'
        ],
        'conditions': [
          ['OS=="win"', { 'defines': [ 'WINDOWS' ] }]
        ]
      },
    ],
  }
