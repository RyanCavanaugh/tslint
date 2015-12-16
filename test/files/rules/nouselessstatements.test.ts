var a, b, c, d, e;
// Error
a || b;
c.d;
d + e;
if(d) {
    a;
}
a || b === c + d;

// OK
a += b;
a();
b = b;
a.b = c;