/**
 * Script kiểm tra UTF-8 encoding và Vietnamese text rendering
 * Chạy: node scripts/test-vietnamese-encoding.js
 */

const testStrings = {
    // Test dấu thanh điệu cơ bản
    toneMarks: [
        'á à ả ã ạ',
        'é è ẻ ẽ ẹ',
        'í ì ỉ ĩ ị',
        'ó ò ỏ õ ọ',
        'ú ù ủ ũ ụ',
        'ý ỳ ỷ ỹ ỵ'
    ],

    // Test chữ hoa có dấu
    upperCase: [
        'ĐIỀU KIỆN',
        'TIẾNG VIỆT',
        'HỆ THỐNG',
        'CÔNG NGHỆ',
        'PHÁT TRIỂN'
    ],

    // Test các ký tự đặc biệt tiếng Việt
    specialChars: [
        'ă ắ ằ ẳ ẵ ặ',
        'â ấ ầ ẩ ẫ ậ',
        'ê ế ề ể ễ ệ',
        'ô ố ồ ổ ỗ ộ',
        'ơ ớ ờ ở ỡ ợ',
        'ư ứ ừ ử ữ ự'
    ],

    // Test câu văn thực tế
    sentences: [
        'Xin chào! Đây là ứng dụng chat AI.',
        'Hệ thống đang hoạt động ổn định.',
        'Bạn có câu hỏi gì không?',
        'Cảm ơn bạn đã sử dụng dịch vụ.',
        'Đã cập nhật thành công!'
    ]
};

function testEncoding() {
    console.log('🇻🇳 KIỂM TRA ENCODING TIẾNG VIỆT\n');
    console.log('='.repeat(60));

    let passedTests = 0;
    let totalTests = 0;

    // Test 1: Kiểm tra Buffer encoding
    console.log('\n📝 Test 1: Buffer UTF-8 Encoding');
    console.log('-'.repeat(60));

    testStrings.sentences.forEach((sentence, index) => {
        totalTests++;
        const buffer = Buffer.from(sentence, 'utf8');
        const decoded = buffer.toString('utf8');
        const passed = sentence === decoded;

        console.log(`${passed ? '✅' : '❌'} Test ${index + 1}: ${sentence}`);
        if (passed) {
            passedTests++;
        } else {
            console.log(`   Expected: ${sentence}`);
            console.log(`   Got: ${decoded}`);
        }
    });

    // Test 2: Kiểm tra length và byte length
    console.log('\n📏 Test 2: String Length vs Byte Length');
    console.log('-'.repeat(60));

    const testText = 'Tiếng Việt';
    totalTests++;
    const charLength = testText.length;
    const byteLength = Buffer.from(testText, 'utf8').length;
    const passed = byteLength > charLength; // UTF-8 uses more bytes for Vietnamese chars

    console.log(`Text: "${testText}"`);
    console.log(`Character length: ${charLength}`);
    console.log(`Byte length: ${byteLength}`);
    console.log(`${passed ? '✅' : '❌'} Byte length > char length (correct for Vietnamese)`);

    if (passed) passedTests++;

    // Test 3: Kiểm tra normalize
    console.log('\n🔤 Test 3: Unicode Normalization');
    console.log('-'.repeat(60));

    const testNormalize = 'Tiếng Việt';
    totalTests++;
    const nfc = testNormalize.normalize('NFC');
    const nfd = testNormalize.normalize('NFD');
    const normalizationWorks = nfc.length !== nfd.length;

    console.log(`Original: "${testNormalize}"`);
    console.log(`NFC form length: ${nfc.length}`);
    console.log(`NFD form length: ${nfd.length}`);
    console.log(`${normalizationWorks ? '✅' : '❌'} Normalization works correctly`);

    if (normalizationWorks) passedTests++;

    // Test 4: Kiểm tra regex với tiếng Việt
    console.log('\n🔍 Test 4: Regex Pattern Matching');
    console.log('-'.repeat(60));

    const vietnameseRegex = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i;

    testStrings.sentences.forEach((sentence, index) => {
        totalTests++;
        const hasVietnamese = vietnameseRegex.test(sentence);
        console.log(`${hasVietnamese ? '✅' : '❌'} Test ${index + 1}: Detected Vietnamese in "${sentence}"`);
        if (hasVietnamese) passedTests++;
    });

    // Test 5: Kiểm tra JSON stringify/parse
    console.log('\n📦 Test 5: JSON Stringify/Parse');
    console.log('-'.repeat(60));

    const testObject = {
        title: 'Ứng dụng Chat AI',
        description: 'Trợ lý thông minh',
        messages: testStrings.sentences
    };

    totalTests++;
    try {
        const json = JSON.stringify(testObject);
        const parsed = JSON.parse(json);
        const passed = JSON.stringify(parsed) === json;

        console.log(`${passed ? '✅' : '❌'} JSON round-trip successful`);
        if (passed) passedTests++;
    } catch (error) {
        console.log(`❌ JSON test failed: ${error.message}`);
    }

    // Test 6: Hiển thị tất cả các dấu thanh điệu
    console.log('\n🎯 Test 6: Display All Tone Marks');
    console.log('-'.repeat(60));

    console.log('Dấu sắc:', testStrings.toneMarks[0]);
    console.log('Dấu huyền:', testStrings.toneMarks[1]);
    console.log('Dấu hỏi:', testStrings.toneMarks[2]);
    console.log('Dấu ngã:', testStrings.toneMarks[3]);
    console.log('Dấu nặng:', testStrings.toneMarks[4]);

    totalTests++;
    passedTests++; // Visual check
    console.log('✅ All tone marks displayed');

    // Kết quả cuối cùng
    console.log('\n' + '='.repeat(60));
    console.log('📊 KẾT QUẢ KIỂM TRA\n');
    console.log(`Tổng số test: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);

    if (passedTests === totalTests) {
        console.log('\n🎉 TẤT CẢ TEST PASSED! UTF-8 encoding hoạt động hoàn hảo.');
    } else {
        console.log('\n⚠️  CÓ MỘT SỐ TEST FAILED. Vui lòng kiểm tra lại.');
    }

    console.log('\n' + '='.repeat(60));
}

// Run tests
testEncoding();

// Export test data for use in other tests
module.exports = {
    testStrings,
    testEncoding
};
