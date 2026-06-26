const assert = require('assert');
const { describe, it } = require('node:test');

const BASE = 'http://localhost:3000/api';

async function req(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
}

describe('Virtualcare Nigeria — API Tests', () => {
  let patientToken;
  let doctorToken;
  let adminToken;

  describe('Health', () => {
    it('GET /health returns ok', async () => {
      const res = await req('GET', '/health');
      assert.equal(res.status, 'ok');
    });
  });

  describe('Auth', () => {
    it('Patient login succeeds', async () => {
      const res = await req('POST', '/auth/login', {
        email: 'patient@virtualcare.com',
        password: 'patient123'
      });
      assert.equal(res.success, true);
      assert.ok(res.data.token);
      patientToken = res.data.token;
    });

    it('Doctor login succeeds', async () => {
      const res = await req('POST', '/auth/login', {
        email: 'doctor@virtualcare.com',
        password: 'doctor123',
        role: 'doctor'
      });
      assert.equal(res.success, true);
      doctorToken = res.data.token;
    });

    it('Admin login succeeds', async () => {
      const res = await req('POST', '/auth/login', {
        email: 'admin@virtualcare.com',
        password: 'admin123',
        role: 'admin'
      });
      assert.equal(res.success, true);
      adminToken = res.data.token;
    });

    it('Wrong password returns error', async () => {
      const res = await req('POST', '/auth/login', {
        email: 'patient@virtualcare.com',
        password: 'wrongpassword'
      });
      assert.equal(res.success, false);
    });

    it('Protected route requires token', async () => {
      const res = await req('GET', '/patients/profile');
      assert.equal(res.success, false);
    });
  });

  describe('Doctors', () => {
    it('GET /doctors returns 7 seeded doctors', async () => {
      const res = await req('GET', '/doctors');
      assert.equal(res.success, true);
      assert.ok(res.data.doctors.length >= 7);
    });

    it('Filter by specialty works', async () => {
      const res = await req('GET', '/doctors?specialty=Cardiology');
      assert.equal(res.success, true);
      res.data.doctors.forEach((d) => {
        assert.equal(d.specialty, 'Cardiology');
      });
    });

    it('Filter by Lagos state works', async () => {
      const res = await req('GET', '/doctors?state=Lagos');
      assert.equal(res.success, true);
      res.data.doctors.forEach((d) => {
        assert.equal(d.stateOfPractice, 'Lagos');
      });
    });

    it('No passwords returned in doctor list', async () => {
      const res = await req('GET', '/doctors');
      res.data.doctors.forEach((d) => {
        assert.equal(d.password, undefined);
      });
    });
  });

  describe('Patient', () => {
    it('GET /patients/profile returns patient data', async () => {
      const res = await req('GET', '/patients/profile', null, patientToken);
      assert.equal(res.success, true);
      assert.equal(res.data.profile.email, 'patient@virtualcare.com');
      assert.equal(res.data.profile.password, undefined);
    });
  });

  describe('Payments', () => {
    it('All amounts formatted in NGN', async () => {
      const res = await req('GET', '/doctors');
      res.data.doctors.forEach((d) => {
        assert.ok(d.pricePerSession >= 1000, 'Price should be in Naira');
      });
    });
  });

  describe('Admin', () => {
    it('Admin can access dashboard stats', async () => {
      const res = await req('GET', '/admin/dashboard', null, adminToken);
      assert.equal(res.success, true);
    });

    it('Patient cannot access admin routes', async () => {
      const res = await req('GET', '/admin/dashboard', null, patientToken);
      assert.equal(res.success, false);
    });
  });
});
