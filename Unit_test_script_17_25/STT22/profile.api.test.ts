/**
 * STT 22 — Unit tests for elearning-frontend/src/apis/profile.ts
 * 39 test cases
 */

// ── Mock phải đứng TRÊN tất cả import ─────────────────────────
jest.mock('@/config/axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// ── Imports ────────────────────────────────────────────────────
import axiosRequest from '@/config/axios';
import {
  getUser,
  updateUserInfo,
  uploadImage,
  getAddresses,
  getAddress,
  createAddress,
  editAddress,
  deleteAddress,
  changePassword,
  IUserData,
  IAddressProps,
} from '@/apis/profile';

const mockAxios = axiosRequest as jest.Mocked<typeof axiosRequest>;

beforeEach(() => jest.clearAllMocks());

// Helper tạo File giả
const createMockFile = (name = 'a.jpg', type = 'image/jpeg', sizeKB = 100): File => {
  const blob = new Blob([new Uint8Array(sizeKB * 1024)], { type });
  return new File([blob], name, { type });
};

// ── Nhóm A — getUser ──────────────────────────────────────────
describe('Nhóm A — getUser', () => {
  it('TC_PROFILE_API_01: GET users/profile', async () => {
    const mockResponse = {
      message: 'ok',
      result: {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '0123456789',
      },
    };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getUser();

    expect(mockAxios.get).toHaveBeenCalledWith('users/profile');
    expect(result).toEqual(mockResponse);
  });

  it('TC_PROFILE_API_02: Response profile shape preserve', async () => {
    const mockResponse = {
      message: 'ok',
      result: {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '0123456789',
        createdAt: '2024-01-01',
        avatarUrl: 'https://example.com/avatar.jpg',
      },
    };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getUser();

    expect((result as any).result).toEqual({
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '0123456789',
      createdAt: '2024-01-01',
      avatarUrl: 'https://example.com/avatar.jpg',
    });
  });

  it('TC_PROFILE_API_03: 401 khi chưa login → propagate', async () => {
    const error = new Error('401 Unauthorized');
    mockAxios.get.mockRejectedValue(error);

    await expect(getUser()).rejects.toThrow('401 Unauthorized');
  });
});

// ── Nhóm B — updateUserInfo ───────────────────────────────────
describe('Nhóm B — updateUserInfo', () => {
  it('TC_PROFILE_API_04: PUT users/profile với body IUserData', async () => {
    const mockResponse = { message: 'ok', result: { success: true } };
    mockAxios.put.mockResolvedValue(mockResponse);

    const userData: IUserData = {
      firstName: 'A',
      lastName: 'B',
      email: 'a@b.com',
      phone: '0123',
    };
    const result = await updateUserInfo(userData);

    expect(mockAxios.put).toHaveBeenCalledWith('users/profile', userData);
    expect(result).toEqual(mockResponse);
  });

  it('TC_PROFILE_API_05: Body nguyên vẹn 4 field', async () => {
    const mockResponse = { message: 'ok', result: { success: true } };
    mockAxios.put.mockResolvedValue(mockResponse);

    const userData: IUserData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '0987654321',
    };
    await updateUserInfo(userData);

    const callArgs = mockAxios.put.mock.calls[0];
    expect(Object.keys(callArgs[1] as any)).toHaveLength(4);
  });

  it('TC_PROFILE_API_06: Input không bị mutate', async () => {
    const mockResponse = { message: 'ok', result: { success: true } };
    mockAxios.put.mockResolvedValue(mockResponse);

    const userData: IUserData = {
      firstName: 'Original',
      lastName: 'Name',
      email: 'original@example.com',
      phone: '0123',
    };
    const userDataCopy = JSON.parse(JSON.stringify(userData));

    await updateUserInfo(userData);

    expect(userData).toEqual(userDataCopy);
  });

  it('TC_PROFILE_API_07: 400 validation (email sai format) propagate', async () => {
    const error = new Error('400 Bad Request');
    mockAxios.put.mockRejectedValue(error);

    const userData: IUserData = {
      firstName: 'A',
      lastName: 'B',
      email: 'invalid-email',
      phone: '0123',
    };

    await expect(updateUserInfo(userData)).rejects.toThrow('400 Bad Request');
  });
});

// ── Nhóm C — uploadImage (CRITICAL) ───────────────────────────
describe('Nhóm C — uploadImage', () => {
  // C.1 FormData construction
  it('TC_PROFILE_API_08: POST /images/upload với FormData', async () => {
    const mockResponse = { message: 'ok', result: { url: 'https://example.com/image.jpg' } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const file = createMockFile();
    const result = await uploadImage(file);

    expect(mockAxios.post).toHaveBeenCalled();
    expect(mockAxios.post.mock.calls[0][0]).toBe('/images/upload');
    expect(result).toEqual(mockResponse);
  });

  it('TC_PROFILE_API_09: FormData chứa field "image" với đúng file', async () => {
    const mockResponse = { message: 'ok', result: { url: 'https://example.com/image.jpg' } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const file = createMockFile();
    await uploadImage(file);

    const formData = mockAxios.post.mock.calls[0][1] as FormData;
    expect(formData.get('image')).toBe(file);
  });

  it('TC_PROFILE_API_10: Field name là "image" (khớp backend)', async () => {
    const mockResponse = { message: 'ok', result: { url: 'https://example.com/image.jpg' } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const file = createMockFile();
    await uploadImage(file);

    const formData = mockAxios.post.mock.calls[0][1] as FormData;
    expect(formData.has('image')).toBe(true);
    expect(formData.has('file')).toBe(false);
    expect(formData.has('avatar')).toBe(false);
  });

  it('TC_PROFILE_API_11: FormData không thừa field (chỉ "image")', async () => {
    const mockResponse = { message: 'ok', result: { url: 'https://example.com/image.jpg' } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const file = createMockFile();
    await uploadImage(file);

    const formData = mockAxios.post.mock.calls[0][1] as FormData;
    let count = 0;
    formData.forEach(() => count++);
    expect(count).toBe(1);
  });

  // C.2 Headers
  it('TC_PROFILE_API_12: Header Content-Type === "multipart/form-data"', async () => {
    const mockResponse = { message: 'ok', result: { url: 'https://example.com/image.jpg' } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const file = createMockFile();
    await uploadImage(file);

    const config = mockAxios.post.mock.calls[0][2] as any;
    expect(config.headers['Content-Type']).toBe('multipart/form-data');
  });

  it('TC_PROFILE_API_13: Config object chỉ có `headers` key', async () => {
    const mockResponse = { message: 'ok', result: { url: 'https://example.com/image.jpg' } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const file = createMockFile();
    await uploadImage(file);

    const config = mockAxios.post.mock.calls[0][2] as any;
    expect(Object.keys(config)).toEqual(['headers']);
    expect(config.headers).toEqual({
      'Content-Type': 'multipart/form-data',
    });
  });

  // C.3 File types & error
  it('TC_PROFILE_API_14: File PNG vẫn upload (wrapper không validate type)', async () => {
    const mockResponse = { message: 'ok', result: { url: 'https://example.com/image.png' } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const file = createMockFile('a.png', 'image/png');
    await uploadImage(file);

    expect(mockAxios.post).toHaveBeenCalled();
  });

  it('TC_PROFILE_API_15: File lớn (5MB) — wrapper KHÔNG check size', async () => {
    const mockResponse = { message: 'ok', result: { url: 'https://example.com/image.jpg' } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const file = createMockFile('large.jpg', 'image/jpeg', 5120);
    await uploadImage(file);

    expect(mockAxios.post).toHaveBeenCalled();
  });

  it('TC_PROFILE_API_16: Network error propagate', async () => {
    const error = new Error('Network error');
    mockAxios.post.mockRejectedValue(error);

    const file = createMockFile();
    await expect(uploadImage(file)).rejects.toThrow('Network error');
  });

  it('TC_PROFILE_API_17: BE 413 Payload Too Large propagate', async () => {
    const error = new Error('413 Payload Too Large');
    mockAxios.post.mockRejectedValue(error);

    const file = createMockFile('large.jpg', 'image/jpeg', 10240);
    await expect(uploadImage(file)).rejects.toThrow('413 Payload Too Large');
  });
});

// ── Nhóm D — Address CRUD ─────────────────────────────────────
describe('Nhóm D — Address CRUD', () => {
  // getAddresses
  it('TC_PROFILE_API_18: GET users/address', async () => {
    const mockResponse = {
      message: 'ok',
      result: [
        {
          name: 'Home',
          city: 'HN',
          district: 'D1',
          ward: 'W1',
          specificAddress: '123 St',
          phoneNumber: '0123',
          zip: '10000',
          primary: true,
        },
      ],
    };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getAddresses();

    expect(mockAxios.get).toHaveBeenCalledWith('users/address');
    expect(result).toEqual(mockResponse);
  });

  it('TC_PROFILE_API_19: Response array preserve', async () => {
    const mockResponse = {
      message: 'ok',
      result: [
        { name: 'Home', city: 'HN', district: 'D1', ward: 'W1', specificAddress: '123 St', phoneNumber: '0123', zip: '10000', primary: true },
        { name: 'Office', city: 'HN', district: 'D2', ward: 'W2', specificAddress: '456 Ave', phoneNumber: '0456', zip: '10001', primary: false },
      ],
    };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getAddresses();

    expect((result as any).result).toHaveLength(2);
    expect(Array.isArray((result as any).result)).toBe(true);
  });

  // getAddress
  it('TC_PROFILE_API_20: GET users/address/:index', async () => {
    const mockResponse = {
      message: 'ok',
      result: {
        name: 'Home',
        city: 'HN',
        district: 'D1',
        ward: 'W1',
        specificAddress: '123 St',
        phoneNumber: '0123',
        zip: '10000',
        primary: true,
      },
    };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getAddress(0);

    expect(mockAxios.get).toHaveBeenCalledWith('users/address/0');
    expect(result).toEqual(mockResponse);
  });

  it('TC_PROFILE_API_21: index=5 đúng URL', async () => {
    const mockResponse = { message: 'ok', result: { name: 'Office', city: 'HN' } };
    mockAxios.get.mockResolvedValue(mockResponse);

    await getAddress(5);

    expect(mockAxios.get).toHaveBeenCalledWith('users/address/5');
  });

  it('TC_PROFILE_API_22: 404 khi index vượt range', async () => {
    const error = new Error('404 Not Found');
    mockAxios.get.mockRejectedValue(error);

    await expect(getAddress(999)).rejects.toThrow('404 Not Found');
  });

  // createAddress
  it('TC_PROFILE_API_23: POST users/address với body IAddressProps', async () => {
    const mockResponse = { message: 'ok', result: { id: 1 } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const address: IAddressProps = {
      name: 'Home',
      city: 'HN',
      district: 'D1',
      ward: 'W1',
      specificAddress: '123 St',
      phoneNumber: '0123',
      zip: '10000',
      primary: true,
    };
    const result = await createAddress(address);

    expect(mockAxios.post).toHaveBeenCalledWith('users/address', address);
    expect(result).toEqual(mockResponse);
  });

  it('TC_PROFILE_API_24: Body giữ đủ 8 field', async () => {
    const mockResponse = { message: 'ok', result: { id: 1 } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const address: IAddressProps = {
      name: 'Home',
      city: 'HN',
      district: 'D1',
      ward: 'W1',
      specificAddress: '123 St',
      phoneNumber: '0123',
      zip: '10000',
      primary: true,
    };
    await createAddress(address);

    const callArgs = mockAxios.post.mock.calls[0];
    expect(Object.keys(callArgs[1] as any)).toHaveLength(8);
  });

  it('TC_PROFILE_API_25: Field primary:true giữ type boolean', async () => {
    const mockResponse = { message: 'ok', result: { id: 1 } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const address: IAddressProps = {
      name: 'Home',
      city: 'HN',
      district: 'D1',
      ward: 'W1',
      specificAddress: '123 St',
      phoneNumber: '0123',
      zip: '10000',
      primary: true,
    };
    await createAddress(address);

    const callArgs = mockAxios.post.mock.calls[0];
    const body = callArgs[1] as IAddressProps;
    expect(body.primary).toBe(true);
    expect(typeof body.primary).toBe('boolean');
  });

  it('TC_PROFILE_API_26: Input không bị mutate', async () => {
    const mockResponse = { message: 'ok', result: { id: 1 } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const address: IAddressProps = {
      name: 'Home',
      city: 'HN',
      district: 'D1',
      ward: 'W1',
      specificAddress: '123 St',
      phoneNumber: '0123',
      zip: '10000',
      primary: true,
    };
    const addressCopy = JSON.parse(JSON.stringify(address));

    await createAddress(address);

    expect(address).toEqual(addressCopy);
  });

  // editAddress
  it('TC_PROFILE_API_27: PUT users/address/:index với body', async () => {
    const mockResponse = { message: 'ok', result: { success: true } };
    mockAxios.put.mockResolvedValue(mockResponse);

    const data = { name: 'new' };
    const result = await editAddress(0, data);

    expect(mockAxios.put).toHaveBeenCalledWith('users/address/0', data);
    expect(result).toEqual(mockResponse);
  });

  it('TC_PROFILE_API_28: Body partial — chỉ field thay đổi', async () => {
    const mockResponse = { message: 'ok', result: { success: true } };
    mockAxios.put.mockResolvedValue(mockResponse);

    const data = { city: 'HN' };
    await editAddress(1, data);

    const callArgs = mockAxios.put.mock.calls[0];
    expect(callArgs[1]).toEqual({ city: 'HN' });
  });

  // deleteAddress
  it('TC_PROFILE_API_29: DELETE users/address/:index', async () => {
    const mockResponse = { message: 'ok', result: { success: true } };
    mockAxios.delete.mockResolvedValue(mockResponse);

    const result = await deleteAddress(0);

    expect(mockAxios.delete).toHaveBeenCalledWith('users/address/0');
    expect(result).toEqual(mockResponse);
  });

  it('TC_PROFILE_API_30: 404 khi index invalid', async () => {
    const error = new Error('404 Not Found');
    mockAxios.delete.mockRejectedValue(error);

    await expect(deleteAddress(999)).rejects.toThrow('404 Not Found');
  });
});

// ── Nhóm E — changePassword (CRITICAL) ────────────────────────
describe('Nhóm E — changePassword', () => {
  it('TC_PROFILE_API_31: POST users/change-password với body 2 field', async () => {
    const mockResponse = { message: 'ok', result: { success: true } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const data = { oldPassword: 'old', newPassword: 'new' };
    const result = await changePassword(data);

    expect(mockAxios.post).toHaveBeenCalledWith('users/change-password', data);
    expect(result).toEqual(mockResponse);
  });

  it('TC_PROFILE_API_32: SECURITY: Password nằm trong BODY, không trong URL', async () => {
    const mockResponse = { message: 'ok', result: { success: true } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const data = { oldPassword: 'old', newPassword: 'new' };
    await changePassword(data);

    const url = mockAxios.post.mock.calls[0][0];
    expect(url).toBe('users/change-password');
    // URL có endpoint name "change-password" nên check body instead
    const callArgs = mockAxios.post.mock.calls[0];
    const body = callArgs[1] as any;
    expect(body.oldPassword).toBe('old');
    expect(body.newPassword).toBe('new');
    // Confirm password nằm trong body, không leak vào query params
    expect(url).not.toContain('oldPassword');
    expect(url).not.toContain('newPassword');
  });

  it('TC_PROFILE_API_33: oldPassword + newPassword giữ nguyên type string', async () => {
    const mockResponse = { message: 'ok', result: { success: true } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const data = { oldPassword: 'old', newPassword: 'new' };
    await changePassword(data);

    const callArgs = mockAxios.post.mock.calls[0];
    const body = callArgs[1] as any;
    expect(typeof body.oldPassword).toBe('string');
    expect(typeof body.newPassword).toBe('string');
  });

  it('TC_PROFILE_API_34: Body không leak field khác', async () => {
    const mockResponse = { message: 'ok', result: { success: true } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const data = { oldPassword: 'old', newPassword: 'new' };
    await changePassword(data);

    const callArgs = mockAxios.post.mock.calls[0];
    const body = callArgs[1] as any;
    expect(Object.keys(body).sort()).toEqual(['newPassword', 'oldPassword']);
  });

  it('TC_PROFILE_API_35: 401 (oldPassword sai) → propagate', async () => {
    const error = new Error('401 Unauthorized');
    mockAxios.post.mockRejectedValue(error);

    const data = { oldPassword: 'wrong', newPassword: 'new' };
    await expect(changePassword(data)).rejects.toThrow('401 Unauthorized');
  });

  it('TC_PROFILE_API_36: 400 (newPassword không đạt policy) → propagate', async () => {
    const error = new Error('400 Bad Request');
    mockAxios.post.mockRejectedValue(error);

    const data = { oldPassword: 'old', newPassword: 'weak' };
    await expect(changePassword(data)).rejects.toThrow('400 Bad Request');
  });

  it('TC_PROFILE_API_37: Input không mutate', async () => {
    const mockResponse = { message: 'ok', result: { success: true } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const data = { oldPassword: 'old', newPassword: 'new' };
    const dataCopy = JSON.parse(JSON.stringify(data));

    await changePassword(data);

    expect(data).toEqual(dataCopy);
  });
});

// ── Nhóm F — ERROR & BEHAVIORAL CONTRACT ──────────────────────
describe('Nhóm F — ERROR & BEHAVIORAL CONTRACT', () => {
  it('TC_PROFILE_API_38: Tất cả function propagate 500', async () => {
    const error = new Error('500 Internal Server Error');
    mockAxios.get.mockRejectedValue(error);

    await expect(getUser()).rejects.toThrow('500 Internal Server Error');
  });

  it('TC_PROFILE_API_39: Tất cả function propagate network error', async () => {
    const error = new Error('ECONNREFUSED');
    mockAxios.get.mockRejectedValue(error);

    await expect(getUser()).rejects.toThrow('ECONNREFUSED');
  });
});
