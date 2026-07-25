import { assertEquals } from '@std/assert'
import { cleanRoute } from 'utils/routes.ts'

Deno.test('cleanRoute should return the correct route', () => {
  assertEquals(cleanRoute('/home/user//documents//file.txt'), '/home/user/documents/file.txt')
  assertEquals(cleanRoute('//etc/ / var/www/    /index.html'), '/etc/var/www/index.html')
  assertEquals(cleanRoute('///user//desktop//file///'), '/user/desktop/file')
  assertEquals(cleanRoute('Mayus/ROute/'), '/mayus/route')
  assertEquals(cleanRoute(''), '/')
  assertEquals(cleanRoute('\\api\\users\\'), '/api/users')
})
