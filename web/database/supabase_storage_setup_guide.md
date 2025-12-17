# Supabase Storage를 사용한 반려동물 사진 업로드 구현 가이드

## 1. Supabase Storage 설정 (Supabase Dashboard에서)

### Step 1: Storage Bucket 생성
1. Supabase Dashboard → Storage 메뉴로 이동
2. "New bucket" 클릭
3. Bucket 설정:
   - **Name**: `pet-images` (또는 원하는 이름)
   - **Public bucket**: ✅ 체크 (이미지 URL로 직접 접근 가능하도록)
   - **File size limit**: 5MB (또는 원하는 크기)
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp,image/gif`

### Step 2: Storage 정책 설정 (RLS)
Storage → Policies → `pet-images` bucket 선택

**정책 1: 업로드 허용 (INSERT)**
```sql
-- 사용자는 자신의 반려동물 이미지만 업로드 가능
CREATE POLICY "Users can upload their own pet images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pet-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**정책 2: 읽기 허용 (SELECT)**
```sql
-- 모든 사용자가 이미지를 볼 수 있음 (public bucket이므로)
CREATE POLICY "Anyone can view pet images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'pet-images');
```

**정책 3: 업데이트 허용 (UPDATE)**
```sql
-- 사용자는 자신의 반려동물 이미지만 수정 가능
CREATE POLICY "Users can update their own pet images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pet-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**정책 4: 삭제 허용 (DELETE)**
```sql
-- 사용자는 자신의 반려동물 이미지만 삭제 가능
CREATE POLICY "Users can delete their own pet images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'pet-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Step 3: pets 테이블에 이미지 URL 컬럼 확인/추가
```sql
-- pets 테이블에 pet_img 컬럼이 있는지 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pets' AND column_name = 'pet_img';

-- 없으면 추가
ALTER TABLE pets 
ADD COLUMN IF NOT EXISTS pet_img TEXT;
```

---

## 2. 프론트엔드 구현 단계

### Step 1: 이미지 업로드 함수 추가 (`common/supabase-config.js`)

```javascript
// SupabaseService 객체에 추가할 함수들

// 반려동물 이미지 업로드
async uploadPetImage(file, userId, petId = null) {
  const client = await getSupabaseClient();
  
  try {
    // 파일 유효성 검사
    if (!file || !file.type.startsWith('image/')) {
      throw new Error('이미지 파일만 업로드 가능합니다.');
    }
    
    // 파일 크기 제한 (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('파일 크기는 5MB 이하여야 합니다.');
    }
    
    // 파일명 생성: userId_petId_timestamp.확장자
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = petId 
      ? `${userId}/${petId}_${timestamp}.${fileExt}`
      : `${userId}/temp_${timestamp}.${fileExt}`;
    
    // Storage에 업로드
    const { data, error } = await client.storage
      .from('pet-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false // 기존 파일 덮어쓰기 방지
      });
    
    if (error) {
      console.error('이미지 업로드 실패:', error);
      throw error;
    }
    
    // Public URL 가져오기
    const { data: urlData } = client.storage
      .from('pet-images')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
    
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    throw error;
  }
},

// 반려동물 이미지 삭제
async deletePetImage(imageUrl) {
  const client = await getSupabaseClient();
  
  try {
    // URL에서 파일 경로 추출
    // 예: https://xxx.supabase.co/storage/v1/object/public/pet-images/userId/petId_timestamp.jpg
    const urlParts = imageUrl.split('/pet-images/');
    if (urlParts.length < 2) {
      console.warn('잘못된 이미지 URL:', imageUrl);
      return false;
    }
    
    const filePath = urlParts[1];
    
    const { error } = await client.storage
      .from('pet-images')
      .remove([filePath]);
    
    if (error) {
      console.error('이미지 삭제 실패:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('이미지 삭제 오류:', error);
    return false;
  }
}
```

### Step 2: createPet 함수 수정 (이미지 URL 저장)

```javascript
// createPet 함수에 이미지 URL 파라미터 추가
async createPet(petData) {
  const client = await getSupabaseClient();
  
  // ... 기존 코드 ...
  
  const insertData = {
    user_id: petData.user_id || petData.userId || '',
    pet_name: petData.name || petData.pet_name || '',
    pet_species: petData.type || petData.pet_species || '',
    detailed_species: detailedSpecies,
    pet_birth: petBirth ? parseInt(petBirth, 10) : null,
    pet_gender: petGender,
    weight: petWeight,
    disease_id: diseaseId,
    pet_warning: petWarning,
    pet_img: petData.pet_img || null, // 이미지 URL 추가
    vaccination: null,
    vaccination_date: null
  };
  
  // ... 나머지 코드 ...
}
```

### Step 3: 반려동물 등록 폼에 이미지 업로드 UI 추가

```html
<!-- 반려동물 등록 폼에 추가 -->
<div class="pet-image-upload">
  <label for="petImageInput" class="image-upload-label">
    <div class="image-preview" id="petImagePreview">
      <span class="upload-placeholder">사진 추가</span>
    </div>
    <input 
      type="file" 
      id="petImageInput" 
      accept="image/*" 
      style="display: none;"
    />
  </label>
</div>
```

```javascript
// 이미지 업로드 처리
const petImageInput = document.getElementById('petImageInput');
const petImagePreview = document.getElementById('petImagePreview');
let selectedImageFile = null;

petImageInput.addEventListener('change', async function(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  // 파일 미리보기
  const reader = new FileReader();
  reader.onload = function(e) {
    petImagePreview.innerHTML = `<img src="${e.target.result}" alt="반려동물 사진" />`;
  };
  reader.readAsDataURL(file);
  
  selectedImageFile = file;
});

// 폼 제출 시 이미지 업로드
async function handlePetRegistration(formData) {
  try {
    const userId = localStorage.getItem('userId');
    
    // 1. 이미지 업로드 (선택사항)
    let imageUrl = null;
    if (selectedImageFile) {
      imageUrl = await SupabaseService.uploadPetImage(
        selectedImageFile, 
        userId
      );
    }
    
    // 2. 반려동물 등록 (이미지 URL 포함)
    const petData = {
      ...formData,
      user_id: userId,
      pet_img: imageUrl
    };
    
    const newPet = await SupabaseService.createPet(petData);
    
    // 3. 등록 성공 후 pet_id로 이미지 파일명 업데이트 (선택사항)
    if (imageUrl && newPet.pet_id) {
      // 파일명에 pet_id 포함하도록 재업로드하거나
      // 그냥 사용해도 됨 (temp_ 접두사로 충분)
    }
    
    return newPet;
  } catch (error) {
    console.error('반려동물 등록 실패:', error);
    throw error;
  }
}
```

---

## 3. 구현 체크리스트

### Supabase 설정
- [ ] Storage bucket 생성 (`pet-images`)
- [ ] Bucket을 public으로 설정
- [ ] Storage RLS 정책 설정 (INSERT, SELECT, UPDATE, DELETE)
- [ ] pets 테이블에 `pet_img` 컬럼 확인/추가

### 프론트엔드 구현
- [ ] `uploadPetImage` 함수 추가
- [ ] `deletePetImage` 함수 추가
- [ ] `createPet` 함수에 이미지 URL 파라미터 추가
- [ ] 반려동물 등록 폼에 이미지 업로드 UI 추가
- [ ] 이미지 미리보기 기능
- [ ] 이미지 업로드 후 URL을 pets 테이블에 저장

### 테스트
- [ ] 이미지 업로드 테스트
- [ ] 이미지 URL이 pets 테이블에 저장되는지 확인
- [ ] 업로드된 이미지가 화면에 표시되는지 확인
- [ ] 이미지 삭제 기능 테스트

---

## 4. 주의사항

1. **파일 크기 제한**: 5MB 이하로 제한 권장
2. **파일 형식**: jpeg, png, webp, gif만 허용
3. **파일명**: 중복 방지를 위해 timestamp 사용
4. **에러 처리**: 업로드 실패 시 사용자에게 알림
5. **이미지 최적화**: 큰 이미지는 리사이즈 후 업로드 권장 (선택사항)

---

## 5. 추가 개선 사항 (선택사항)

### 이미지 리사이즈 (Canvas API 사용)
```javascript
function resizeImage(file, maxWidth = 800, maxHeight = 800) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(resolve, 'image/jpeg', 0.8);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
```

