import sqlite3,pathlib,tempfile,concurrent.futures
schema=next(pathlib.Path('drizzle').glob('0000_*.sql')).read_text()
with tempfile.TemporaryDirectory() as d:
    path=d+'/test.db';db=sqlite3.connect(path);db.executescript(schema)
    db.execute("INSERT INTO rooms VALUES ('IET20','IET20','IET',1,'Classroom',75,'[]','[]','test','confirmed')");db.commit();db.close()
    def insert(id,start,end,status='confirmed'):
        c=sqlite3.connect(path,timeout=5)
        try:
            c.execute('INSERT INTO bookings VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',(id,'IET20','Test','2026-11-05',start,end,'Extra class',60,'CSE','2','A','2025-2029','test','Test faculty',status,1,'2026-11-05'));c.commit();return 'saved'
        except sqlite3.IntegrityError as e:
            assert 'booking_overlap' in str(e);return 'blocked'
        finally:c.close()
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        assert sorted(pool.map(lambda id:insert(id,600,660),['a','b']))==['blocked','saved']
    assert insert('adjacent',660,720)=='saved';assert insert('cancelled',610,650,'cancelled')=='saved'
    c=sqlite3.connect(path)
    try:
        c.execute("UPDATE bookings SET start=630 WHERE id='adjacent'");raise AssertionError('Overlap update was allowed')
    except sqlite3.IntegrityError as e:assert 'booking_overlap' in str(e)
    c.close()
print('PASS: simultaneous collision, adjacent slots, cancelled booking and update overlap protection')
