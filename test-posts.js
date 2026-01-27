/**
 * Topics and Posts Test Script
 * 
 * Tests the topics and posts endpoints.
 * Requires a running server and database with at least one topic.
 */

// Load .env file only in local development
if (process.env.NODE_ENV !== 'production') {
  try {
    await import('dotenv/config');
  } catch (error) {
    // dotenv not available, using system environment variables
  }
}

const API_URL = `http://localhost:${process.env.PORT || 3000}`;

// Test utilities
function log(message, data = '') {
  console.log(`${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`);
}

function logError(message, error) {
  console.error(`❌ ${message}`);
  if (error) console.error(error);
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

// Register and login a test user
async function setupTestUser() {
  const timestamp = Date.now();
  const testUser = {
    email: `testpost${timestamp}@example.com`,
    username: `postuser${timestamp}`,
    password: 'SecurePassword123'
  };

  // Register
  const registerRes = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser)
  });

  if (registerRes.status !== 201) {
    throw new Error('Failed to register test user');
  }

  // Login
  const loginRes = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password
    })
  });

  const loginData = await loginRes.json();
  if (loginRes.status !== 200 || !loginData.token) {
    throw new Error('Failed to login test user');
  }

  return {
    user: loginData.user,
    token: loginData.token
  };
}

// Test Topics endpoints
async function testTopics() {
  console.log('\n📂 Testing Topics Endpoints...\n');

  try {
    // List all topics
    const response = await fetch(`${API_URL}/api/topics`);
    const data = await response.json();

    if (response.status === 200 && data.topics) {
      logSuccess(`List topics works (found ${data.count} topics)`);
      
      if (data.topics.length > 0) {
        const firstTopic = data.topics[0];
        log('First topic:', firstTopic);

        // Get topic by ID
        const byIdRes = await fetch(`${API_URL}/api/topics/${firstTopic.id}`);
        if (byIdRes.status === 200) {
          logSuccess('Get topic by ID works');
        } else {
          logError('Get topic by ID failed');
        }

        // Get topic by name
        const byNameRes = await fetch(`${API_URL}/api/topics/by-name/${encodeURIComponent(firstTopic.name)}`);
        if (byNameRes.status === 200) {
          logSuccess('Get topic by name works');
        } else {
          logError('Get topic by name failed');
        }

        return firstTopic.id;
      } else {
        logError('No topics found in database', 'Please add at least one topic to test posts');
        return null;
      }
    } else {
      logError('List topics failed', data);
      return null;
    }
  } catch (error) {
    logError('Topics test error', error.message);
    return null;
  }
}

// Test Posts endpoints
async function testPosts(topicId, token, userId) {
  console.log('\n📝 Testing Posts Endpoints...\n');

  try {
    // Test: Create post with valid content
    const validPost = {
      title: 'Understanding JavaScript Closures',
      content: 'A closure is a function that has access to variables in its outer scope, even after the outer function has returned. This is a powerful feature of JavaScript that enables data privacy and function factories. Closures are created every time a function is created. When we define a function inside another function, the inner function has access to the outer functions variables. This happens because JavaScript uses lexical scoping, which means that the scope of a variable is defined by its location in the source code. Closures are commonly used in JavaScript for callbacks, event handlers, and creating private variables. Understanding closures is essential for writing effective JavaScript code and avoiding common pitfalls like memory leaks.',
      primaryTopicId: topicId
    };

    const createRes = await fetch(`${API_URL}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(validPost)
    });

    const createData = await createRes.json();

    if (createRes.status === 201 && createData.post) {
      logSuccess(`Create post works (${createData.wordCount} words)`);
      log('Created post:', createData.post);
      
      const postId = createData.post.id;

      // Test: Get post by ID
      const getRes = await fetch(`${API_URL}/api/posts/${postId}`);
      if (getRes.status === 200) {
        logSuccess('Get post by ID works');
      } else {
        logError('Get post by ID failed');
      }

      // Test: List posts
      const listRes = await fetch(`${API_URL}/api/posts`);
      if (listRes.status === 200) {
        logSuccess('List posts works');
      } else {
        logError('List posts failed');
      }

      // Test: Get posts by topic
      const byTopicRes = await fetch(`${API_URL}/api/posts/topic/${topicId}`);
      if (byTopicRes.status === 200) {
        logSuccess('Get posts by topic works');
      } else {
        logError('Get posts by topic failed');
      }

      // Test: Get posts by author
      const byAuthorRes = await fetch(`${API_URL}/api/posts/author/${userId}`);
      if (byAuthorRes.status === 200) {
        logSuccess('Get posts by author works');
      } else {
        logError('Get posts by author failed');
      }

      // Test: Update post
      const updateRes = await fetch(`${API_URL}/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: 'Understanding JavaScript Closures - Updated'
        })
      });

      if (updateRes.status === 200) {
        logSuccess('Update post works');
      } else {
        logError('Update post failed');
      }

      // Test: Delete post
      const deleteRes = await fetch(`${API_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (deleteRes.status === 200) {
        logSuccess('Delete post (soft delete) works');
      } else {
        logError('Delete post failed');
      }

      return true;
    } else {
      logError('Create post failed', createData);
      return false;
    }
  } catch (error) {
    logError('Posts test error', error.message);
    return false;
  }
}

// Test word count validation
async function testWordCountValidation(topicId, token) {
  console.log('\n📏 Testing Word Count Validation...\n');

  try {
    // Test: Too few words (< 80)
    const tooShort = {
      title: 'Too Short',
      content: 'This content has only a few words and should be rejected.',
      primaryTopicId: topicId
    };

    const shortRes = await fetch(`${API_URL}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(tooShort)
    });

    if (shortRes.status === 400) {
      logSuccess('Short content rejected (< 80 words)');
    } else {
      logError('Short content was not rejected');
    }

    // Test: Too many words (> 220)
    const tooLong = {
      title: 'Too Long',
      content: 'word '.repeat(225).trim(),
      primaryTopicId: topicId
    };

    const longRes = await fetch(`${API_URL}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(tooLong)
    });

    if (longRes.status === 400) {
      logSuccess('Long content rejected (> 220 words)');
    } else {
      logError('Long content was not rejected');
    }

    // Test: Invalid topic
    const invalidTopic = {
      title: 'Invalid Topic',
      content: 'This is a test post with a valid word count that meets the minimum requirement of at least eighty words. We need to ensure that the content validation is working properly and rejecting posts that do not meet our strict requirements. The word count must be between eighty and two hundred twenty words. This text should have exactly enough words to pass the validation. Let us continue adding more content to make sure we reach the required minimum. Almost there now just need a few more words to complete.',
      primaryTopicId: 99999
    };

    const invalidRes = await fetch(`${API_URL}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(invalidTopic)
    });

    if (invalidRes.status === 404) {
      logSuccess('Invalid topic rejected');
    } else {
      logError('Invalid topic was not rejected');
    }

  } catch (error) {
    logError('Word count validation test error', error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 LearnLoop Topics and Posts Tests\n');
  console.log('='.repeat(50));

  // Check if server is running
  try {
    const healthCheck = await fetch(`${API_URL}/health`);
    if (!healthCheck.ok) {
      console.error('❌ Server is not running or health check failed');
      console.log('\nPlease start the server first: npm start');
      process.exit(1);
    }
    logSuccess('Server is running');
  } catch (error) {
    console.error('❌ Cannot connect to server');
    console.log('\nPlease start the server first: npm start');
    process.exit(1);
  }

  // Test topics
  const topicId = await testTopics();
  if (!topicId) {
    console.error('\n❌ Cannot proceed without topics');
    console.log('\nPlease add at least one topic to the database.');
    console.log('You can use Prisma Studio: npm run db:studio');
    process.exit(1);
  }

  // Setup test user
  console.log('\n👤 Setting up test user...\n');
  const { user, token } = await setupTestUser();
  logSuccess(`Test user created: ${user.username}`);

  // Test posts
  await testPosts(topicId, token, user.id);

  // Test validation
  await testWordCountValidation(topicId, token);

  console.log('\n' + '='.repeat(50));
  console.log('\n✅ All topics and posts tests completed!\n');
}

runTests();
