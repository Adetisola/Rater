const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../src/logic/mockData.ts');
let content = fs.readFileSync(targetFile, 'utf8');

const reviews = [];
let reviewIdCounter = 1;

function addReviews(postId, count, minScore, maxScore, daysAgoStart, daysAgoEnd) {
    let availableAvatars = ['user_1', 'user_2', 'user_3', 'user_4', 'user_5'];
    
    for (let i = 0; i < count; i++) {
        let reviewer_id = null;
        let device_id = null;
        let reviewer_name = null;
        
        if (availableAvatars.length > 0) {
            // Pick a random avatar and remove it from available
            const randomIndex = Math.floor(Math.random() * availableAvatars.length);
            reviewer_id = availableAvatars.splice(randomIndex, 1)[0];
        } else {
            // Guest review
            device_id = `device_${Math.random().toString(36).substring(2, 9)}`;
            if (Math.random() > 0.5) {
                reviewer_name = `Guest ${Math.floor(Math.random() * 1000)}`;
            }
        }
        
        // Random score between min and max (multiples of 0.5 or 1)
        const getScore = () => {
            const val = minScore + Math.random() * (maxScore - minScore);
            return Math.min(5.0, Math.max(1.0, Math.round(val * 2) / 2)); // nearest 0.5
        };
        
        const clarity = getScore();
        const purpose = getScore();
        const aesthetics = getScore();
        
        // Random date between daysAgoStart and daysAgoEnd
        const daysAgo = daysAgoEnd + Math.random() * (daysAgoStart - daysAgoEnd);
        const dateStr = `new Date(Date.now() - 1000 * 60 * 60 * 24 * ${daysAgo.toFixed(2)}).toISOString()`;
        
        const props = [
            `id: 'r${reviewIdCounter++}'`,
            `post_id: '${postId}'`,
            reviewer_id ? `reviewer_id: '${reviewer_id}'` : '',
            device_id ? `device_id: '${device_id}'` : '',
            reviewer_name ? `reviewer_name: '${reviewer_name}'` : '',
            `clarity: ${clarity}`,
            `purpose: ${purpose}`,
            `aesthetics: ${aesthetics}`,
            `created_at: ${dateStr}`
        ].filter(p => p !== '').join(',\n    ');

        const review = `  {\n    ${props}\n  }`;
        reviews.push(review);
    }
}

// A. HIGH QUALITY POSTS (6-15 reviews, high scores 4.5-5)
addReviews('post_1', 12, 4.5, 5.0, 0.1, 0);   // 4 hours ago post, recent reviews
addReviews('post_11', 10, 4.0, 5.0, 2, 0.5);  // 3 days ago post
addReviews('post_6', 8, 4.5, 5.0, 2.5, 0.5);  // 3 days ago post
addReviews('post_19', 14, 4.5, 5.0, 10, 5);   // 11 days ago post
addReviews('post_3', 7, 4.5, 5.0, 4, 1);      // 5 days ago post

// B. POPULAR BUT MID QUALITY (10-20 reviews, avg 3-4)
addReviews('post_8', 18, 2.5, 4.0, 9, 2);     // 10 days ago post
addReviews('post_13', 12, 3.0, 4.5, 0.2, 0);  // 8 hours ago post
addReviews('post_17', 20, 2.5, 4.0, 0.4, 0);  // 12 hours ago post

// C. HIGH SCORE BUT LOW REVIEWS (1-2 reviews, score 5)
addReviews('post_10', 2, 5.0, 5.0, 20, 10);   // 21 days ago post
addReviews('post_14', 1, 5.0, 5.0, 3, 1);     // 4 days ago post
addReviews('post_22', 2, 4.5, 5.0, 12, 8);    // 13 days ago post

// D. EDGE CASE (UNLOCK BOUNDARY) (3-5 reviews)
addReviews('post_12', 4, 3.5, 4.5, 5, 2);     // 6 days ago post
addReviews('post_2', 3, 4.5, 5.0, 0.05, 0);   // 2 hours ago post
addReviews('post_15', 5, 4.0, 5.0, 4, 1);     // 5 days ago post
addReviews('post_21', 3, 3.0, 4.0, 7, 3);     // 8 days ago post

// E. LOW QUALITY POSTS (Many reviews, score 2-3)
addReviews('post_4', 18, 1.5, 3.5, 0.8, 0);   // 1 day ago post
addReviews('post_9', 15, 1.0, 3.0, 13, 2);    // 14 days ago post
addReviews('post_18', 10, 2.0, 3.5, 6, 2);    // 7 days ago post
addReviews('post_25', 12, 2.0, 3.0, 14, 5);   // 15 days ago post

// F. NO REVIEWS
// post_16, post_20, post_5, post_23, post_24, post_7, post_26, post_27, post_28, post_29, post_30, etc.

let badges = `// --- MOCK BADGES (Historical & Active Store) ---
export const MOCK_BADGES: Badge[] = [
  // Previous Top Rated (Old, might be low ranked now, >7 days)
  {
    post_id: 'post_8',
    badge_type: 'top_rated_previous',
    awarded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString()
  },
  {
    post_id: 'post_10',
    badge_type: 'top_rated_previous',
    awarded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString()
  },
  {
    post_id: 'post_9',
    badge_type: 'top_rated_previous',
    awarded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString()
  },
  {
    post_id: 'post_19',
    badge_type: 'top_rated_previous',
    awarded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString()
  }
];
`;

let reviewsCode = `// --- MOCK REVIEWS ---
export const MOCK_REVIEWS: Review[] = [\n${reviews.join(',\n')}\n];`;

// Replace MOCK_REVIEWS and MOCK_BADGES in content
const reviewsRegex = /\/\/ --- MOCK REVIEWS ---[\s\S]*?(?=\/\/ --- MOCK BADGES \(Historical & Active Store\) ---)/;
const badgesRegex = /\/\/ --- MOCK BADGES \(Historical & Active Store\) ---[\s\S]*?(?=\/\*\*[\s\S]*?\* SIMULATED RELATIONSHIP HELPERS)/;

if (reviewsRegex.test(content) && badgesRegex.test(content)) {
    content = content.replace(reviewsRegex, reviewsCode + '\n\n');
    content = content.replace(badgesRegex, badges + '\n\n');
    fs.writeFileSync(targetFile, content);
    console.log("Successfully updated src/logic/mockData.ts");
} else {
    console.log("Regex replacement failed.");
}
