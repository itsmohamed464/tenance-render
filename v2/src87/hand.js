    // ---- POV hand + forearm for close-ups, keyframe + arc helpers ----
    const skinM = M.std('#e8b98f', { roughness: 0.7 });
    const HD = new T3.Group(); D.add(HD); HD.visible = false;
    mesh(new T3.CapsuleGeometry(0.032, 1.0, 6, 14), SLEEVE, HD, [0, 0.58, 0]);
    mesh(new T3.CylinderGeometry(0.036, 0.036, 0.03, 14), skinM, HD, [0, 0.07, 0]);
    mesh(new T3.SphereGeometry(0.05, 16, 12), skinM, HD, [0, 0, 0]).scale.set(1, 0.85, 1.1);
    mesh(new T3.CapsuleGeometry(0.016, 0.04, 4, 8), skinM, HD, [0.052, -0.012, 0.02], [0, 0, 0.7]);
    [-0.028, 0, 0.028].forEach((fx) => mesh(new T3.CapsuleGeometry(0.014, 0.04, 4, 8), skinM, HD, [fx, -0.055, 0.012]));
    const _bk = new T3.Vector3(), _up = new T3.Vector3(0, 1, 0), _w = new T3.Vector3();
    const handAt = (p, bx, by, bz) => { HD.position.copy(p); HD.quaternion.setFromUnitVectors(_up, _bk.set(bx, by, bz).normalize()); };
    const arcV = (out, a, b, u, h) => { out.lerpVectors(a, b, u); out.y += h * Math.sin(Math.PI * u); return out; };
