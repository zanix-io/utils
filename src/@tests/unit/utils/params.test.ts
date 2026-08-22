import { assertEquals } from '@std/assert'
import { processUrlParams } from 'utils/params.ts'

Deno.test('processUrlParams should handle invalid URI components gracefully', () => {
  const input = {
    badString: '%E0%A4%A', // malformed
  }

  const result = processUrlParams(input)
  assertEquals(result.badString, '%E0%A4%A') // decoding fails, returns original
})

Deno.test('processUrlParams should return the same primitive value if not an object', () => {
  assertEquals(processUrlParams(null), null)
  assertEquals(processUrlParams(42), 42)
  assertEquals(processUrlParams('Test'), 'Test')
  assertEquals(processUrlParams(true), true)
})

Deno.test('processUrlParams should decode mixed nested arrays and objects', () => {
  const input = {
    users: [
      {
        name: 'Bob%20Builder',
        hobbies: ['Fixing%20things', 'Driving%20truck'],
      },
      {
        name: 'Wendy%20Helper',
      },
    ],
  }

  const expected = {
    users: [
      {
        name: 'Bob Builder',
        hobbies: ['Fixing things', 'Driving truck'],
      },
      {
        name: 'Wendy Helper',
      },
    ],
  }

  assertEquals(processUrlParams(input), expected)
})
