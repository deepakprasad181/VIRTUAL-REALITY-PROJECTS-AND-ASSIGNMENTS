#include <GL/glut.h>
#include <math.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

// ... rest of your code

// Define maximum limits for various objects in the scene
#define MAX_TREES 200
#define MAX_CLOUDS 5
#define MAX_RAIN 200

// Structure to define a Tree object
typedef struct {
    float x, z;          // Position of the tree
    float trunkHeight;   // Height of the tree's trunk
    float canopySize;    // Size of the tree's canopy
    float growth;        // Current growth factor 
    float growthSpeed;   // Speed at which the tree grows
    int growing;         // Flag indicating if the tree is currently growing
    float rotation;      // Static random rotation for the tree
} Tree;

// Structure to define a Hole (for planting trees)
typedef struct {
    int active;          // Flag indicating if the hole is active
    float x, z;          // Position of the hole
} Hole;

// Structure to define a Cloud object
typedef struct {
    float x, y, z;       // Position of the cloud
    float speed;         // Movement speed of the cloud
} Cloud;

// Structure to define a Raindrop object
typedef struct {
    float x, y, z;       // Position of the raindrop
    float speed;         // Falling speed of the raindrop
} Raindrop;

// Global arrays to store trees, hole, clouds, and raindrops
Tree trees[MAX_TREES];
int treeCount = 0;       // Current number of trees
Hole hole = {0, 0.0f, 0.0f}; // Initialize hole as inactive

// Camera parameters
float camX = 0.0f, camY = 2.0f, camZ = 5.0f; // Camera position
float camYaw = 0.0f, camPitch = 0.0f;       // Camera orientation (yaw and pitch)
float moveSpeed = 0.5f;                     // Speed of camera movement
int keyStates[256] = {0};                   // Array to track keyboard key states

// Light toggles for different light sources
int light0_enabled = 1, light1_enabled = 0, light2_enabled = 0, light3_enabled = 0, light4_enabled = 0;

// Clouds & Rain parameters
Cloud clouds[MAX_CLOUDS];
Raindrop rain[MAX_CLOUDS][MAX_RAIN]; // Raindrops for each cloud
int raining = 0;                     // Flag to indicate if it's raining

// Status text displayed on screen
char statusText[50] = "";
int showStatus = 0; // Flag to show/hide status text


void initForest() {
    srand(time(NULL)); // Seed the random number generator
    for (int i = 0; i < 100; i++) { // Create 100 initial trees
        float x = ((rand() % 500) - 250); // Random X position between -250 and 250
        float z = ((rand() % 500) - 250); // Random Z position between -250 and 250
        if (fabs(x) < 5 && fabs(z) < 5) continue;
        trees[treeCount].x = x;
        trees[treeCount].z = z;
        trees[treeCount].trunkHeight = 3.0f + rand() % 3; // Random trunk height
        trees[treeCount].canopySize = 2.0f + rand() % 2;   // Random canopy size
        trees[treeCount].growth = 1.0f;                    // Fully grown initially
        trees[treeCount].growthSpeed = 0.0f;               // No initial growth speed
        trees[treeCount].growing = 0;                      // Not initially growing
        trees[treeCount].rotation = rand() % 360;          // Static random rotation
        treeCount++;
    }
}


void initClouds() {
    for (int i = 0; i < MAX_CLOUDS; i++) {
        clouds[i].x = ((rand() % 400) - 200); // Random X position
        clouds[i].z = ((rand() % 400) - 200); // Random Z position
        clouds[i].y = 40.0f + rand() % 10;    // Random Y position (height)
        clouds[i].speed = 0.02f + ((rand() % 10) / 500.0f); // Random speed
        for (int j = 0; j < MAX_RAIN; j++) {
            rain[i][j].x = clouds[i].x + ((rand() % 20) - 10); // X relative to cloud
            rain[i][j].z = clouds[i].z + ((rand() % 20) - 10); // Z relative to cloud
            rain[i][j].y = clouds[i].y;                          // Start at cloud height
            rain[i][j].speed = 0.2f + ((rand() % 5) / 50.0f);    // Random fall speed
        }
    }
}


void initLights() {
    glEnable(GL_LIGHTING); // Enable lighting calculations
    glEnable(GL_LIGHT0);   // Enable Light 0

    GLfloat lightPos0[] = {0.5f, 1.0f, 0.5f, 0.0f}; // Directional light source
    glLightfv(GL_LIGHT0, GL_POSITION, lightPos0);
    GLfloat ambient0[] = {0.2f, 0.2f, 0.2f, 1.0f}; // Ambient color for Light 0
    glLightfv(GL_LIGHT0, GL_AMBIENT, ambient0);

    // Ambient colors for other lights (can be toggled)
    GLfloat ambient1[] = {0.1f, 0.0f, 0.0f, 1.0f};
    GLfloat ambient2[] = {0.0f, 0.1f, 0.0f, 1.0f};
    GLfloat ambient3[] = {0.0f, 0.0f, 0.1f, 1.0f};
    GLfloat ambient4[] = {0.1f, 0.1f, 0.0f, 1.0f};

    glLightfv(GL_LIGHT1, GL_AMBIENT, ambient1);
    glLightfv(GL_LIGHT2, GL_AMBIENT, ambient2);
    glLightfv(GL_LIGHT3, GL_AMBIENT, ambient3);
    glLightfv(GL_LIGHT4, GL_AMBIENT, ambient4);
}

void updateLights() {
    if (light0_enabled) glEnable(GL_LIGHT0); else glDisable(GL_LIGHT0);
    if (light1_enabled) glEnable(GL_LIGHT1); else glDisable(GL_LIGHT1);
    if (light2_enabled) glEnable(GL_LIGHT2); else glDisable(GL_LIGHT2);
    if (light3_enabled) glEnable(GL_LIGHT3); else glDisable(GL_LIGHT3);
    if (light4_enabled) glEnable(GL_LIGHT4); else glDisable(GL_LIGHT4);
}

void init() {
    glEnable(GL_DEPTH_TEST);     // Enable depth testing for proper rendering of overlapping objects
    glEnable(GL_COLOR_MATERIAL); // Enable color tracking for materials
    glShadeModel(GL_SMOOTH);     // Use smooth shading for polygons

    glEnable(GL_FOG);            // Enable fog effect
    GLfloat fogColor[4] = {0.7f, 0.7f, 0.7f, 1.0f}; // Light grey fog color
    glFogfv(GL_FOG_COLOR, fogColor);
    glFogf(GL_FOG_DENSITY, 0.0015f); // Set fog density
    glFogi(GL_FOG_MODE, GL_EXP2);    // Use exponential squared fog mode

    glClearColor(0.5f, 0.8f, 1.0f, 1.0f); // Set background color (sky blue)

    initForest();  // Initialize trees
    initLights();  // Initialize lighting
    initClouds();  // Initialize clouds
}

void drawText(const char* text) {
    glDisable(GL_LIGHTING); // Disable lighting to draw text in a flat color
    glColor3f(1.0f, 1.0f, 1.0f); // Set text color to white
    glRasterPos2f(-0.95f, 0.9f); // Position the text in normalized device coordinates
    for (const char* c = text; *c != '\0'; c++) {
        glutBitmapCharacter(GLUT_BITMAP_HELVETICA_18, *c); // Draw each character
    }
    glEnable(GL_LIGHTING); // Re-enable lighting
}

void drawGround() {
    glBegin(GL_QUADS);
    glColor3f(0.3f, 0.6f, 0.2f); // Green color for the ground
    glNormal3f(0.0f, 1.0f, 0.0f); // Normal pointing up
    glVertex3f(-250.0f, 0.0f, -250.0f); // Vertices of the quad
    glVertex3f( 250.0f, 0.0f, -250.0f);
    glVertex3f( 250.0f, 0.0f,  250.0f);
    glVertex3f(-250.0f, 0.0f,  250.0f);
    glEnd();
}

void drawMountains() {
    glBegin(GL_TRIANGLES);
    for (float i = -600; i < 600; i += 150) { // Loop to draw multiple mountain peaks
        glColor3f(0.5f, 0.5f, 0.5f); // Base color
        glVertex3f(i, 0.0f, -500.0f);
        glColor3f(0.7f, 0.7f, 0.7f); // Peak color
        glVertex3f(i + 75, 120.0f, -550.0f); // Peak vertex
        glColor3f(0.5f, 0.5f, 0.5f); // Base color
        glVertex3f(i + 150, 0.0f, -500.0f);
    }
    glEnd();
}

void drawClouds() {
    for (int i = 0; i < MAX_CLOUDS; i++) {
        glPushMatrix();
        glTranslatef(clouds[i].x, clouds[i].y, clouds[i].z); // Move to cloud's position
        glColor4f(1.0f, 1.0f, 1.0f, 0.8f); // White color with some transparency
        glutSolidSphere(5.0, 8, 8); // Main sphere
        glutSolidSphere(4.0, 8, 8); // Smaller overlapping sphere
        glTranslatef(3.0f, 0.0f, 2.0f); // Offset for another part of the cloud
        glutSolidSphere(3.0, 8, 8);     // Smallest sphere
        glPopMatrix();
    }
}

void drawRain() {
    glColor3f(0.5f, 0.5f, 1.0f); // Blue color for raindrops
    glBegin(GL_LINES);           // Draw as lines
    for (int i = 0; i < MAX_CLOUDS; i++) {
        for (int j = 0; j < MAX_RAIN; j++) {
            glVertex3f(rain[i][j].x, rain[i][j].y, rain[i][j].z);         // Start of raindrop line
            glVertex3f(rain[i][j].x, rain[i][j].y - 0.5f, rain[i][j].z); // End of raindrop line
        }
    }
    glEnd();
}

void drawTree(Tree *t) {
    glPushMatrix();
    glTranslatef(t->x, 0.0f, t->z); // Move to tree's base position
    glRotatef(t->rotation, 0, 1, 0); // Apply static random rotation around Y-axis
    float trunkH = t->trunkHeight * t->growth; // Calculate current trunk height
    float canopy = t->canopySize * t->growth;  // Calculate current canopy size
    // Draw trunk
    glColor3f(0.55f, 0.27f, 0.07f); // Brown color for trunk
    GLUquadric *quad = gluNewQuadric(); // Create a new quadric object for cylinder
    glPushMatrix();
    glRotatef(-90, 1, 0, 0); // Rotate cylinder to stand upright
    gluCylinder(quad, 0.2f, 0.2f, trunkH, 8, 8); // Draw cylinder (trunk)
    glPopMatrix();

    glTranslatef(0.0f, trunkH, 0.0f); // Move up to the top of the trunk
    glColor3f(0.0f, 0.5f, 0.0f);      // Green color for canopy

    glutSolidSphere(canopy * 0.5f, 10, 10); // Main canopy sphere
    glTranslatef(0.3f, 0.2f, 0.0f);        // Offset for an overlapping sphere
    glutSolidSphere(canopy * 0.4f, 10, 10);
    glTranslatef(-0.6f, 0.0f, 0.0f);       // Offset for another overlapping sphere
    glutSolidSphere(canopy * 0.4f, 10, 10);

    gluDeleteQuadric(quad); // Delete the quadric object to free resources
    glPopMatrix();
}

void drawHole() {
    if (hole.active) {
        glPushMatrix();
        glTranslatef(hole.x, 0.001f, hole.z); // Position slightly above ground to prevent Z-fighting
        glColor3f(0.1f, 0.1f, 0.1f);          // Dark grey color for the hole
        GLUquadric *disk = gluNewQuadric();   // Create a new quadric object for disk
        gluDisk(disk, 0.0f, 0.7f, 20, 1);     // Draw a filled disk
        gluDeleteQuadric(disk);               // Delete the quadric object
        glPopMatrix();
    }
}

void display() {
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT); // Clear color and depth buffers
    updateLights(); // Update light states (enabled/disabled)

    glLoadIdentity(); // Reset the modelview matrix
    // Calculate camera look-at point based on yaw and pitch
    float lx = cos(camPitch) * sin(camYaw);
    float ly = sin(camPitch);
    float lz = -cos(camPitch) * cos(camYaw);
    gluLookAt(camX, camY, camZ,       // Camera position
              camX + lx, camY + ly, camZ + lz, // Look-at point
              0.0f, 1.0f, 0.0f);     // Up vector

    drawMountains(); // Draw distant mountains
    drawGround();    // Draw the ground
    drawClouds();    // Draw clouds
    if (raining) drawRain(); // Draw rain if raining is enabled
    for (int i = 0; i < treeCount; i++) drawTree(&trees[i]); // Draw all trees
    drawHole(); // Draw the hole if active

    // Draw status text if enabled
    if (showStatus) {
        glMatrixMode(GL_PROJECTION); // Switch to projection matrix
        glPushMatrix();              // Save current projection matrix
        glLoadIdentity();            // Reset projection matrix
        gluOrtho2D(-1, 1, -1, 1);    // Set up 2D orthographic projection for text
        glMatrixMode(GL_MODELVIEW);  // Switch to modelview matrix
        glPushMatrix();              // Save current modelview matrix
        glLoadIdentity();            // Reset modelview matrix
        drawText(statusText);        // Draw the status text
        glPopMatrix();               // Restore previous modelview matrix
        glMatrixMode(GL_PROJECTION); // Switch back to projection matrix
        glPopMatrix();               // Restore previous projection matrix
        glMatrixMode(GL_MODELVIEW);  // Switch back to modelview matrix
    }
    glutSwapBuffers(); // Swap front and back buffers to display the rendered scene
}

void reshape(int w, int h) {
    if (h == 0) h = 1; // Prevent division by zero
    float ratio = w * 1.0f / h; // Calculate aspect ratio
    glMatrixMode(GL_PROJECTION); // Switch to projection matrix
    glLoadIdentity();            // Reset projection matrix
    gluPerspective(60.0f, ratio, 0.1f, 2000.0f); // Set up perspective projection
    glMatrixMode(GL_MODELVIEW);  // Switch back to modelview matrix
    glLoadIdentity();            // Reset modelview matrix
}

void keyboard(unsigned char key, int x, int y) {
    keyStates[key] = 1; // Mark the key as pressed
    if (key == 'g' || key == 'G') {
        // Calculate hole position in front of the camera
        float hx = camX + sin(camYaw) * 2.0f;
        float hz = camZ + -cos(camYaw) * 2.0f;
        hole.active = 1;  // Activate the hole
        hole.x = hx;      // Set hole X position
        hole.z = hz;      // Set hole Z position
        strcpy(statusText, "Seeding in progress"); // Update status text
        showStatus = 1;   // Show status text
    }
    if (key == 't' || key == 'T') {
        // Plant a tree if a hole is active and max tree count not reached
        if (hole.active && treeCount < MAX_TREES) {
            trees[treeCount].x = hole.x;
            trees[treeCount].z = hole.z;
            trees[treeCount].trunkHeight = 3.0f;
            trees[treeCount].canopySize = 2.0f;
            trees[treeCount].growth = 0.05f;      // Start with small growth
            trees[treeCount].growthSpeed = 0.001f; // Set growth speed
            trees[treeCount].growing = 1;         // Mark as growing
            trees[treeCount].rotation = rand() % 360; // Assign a random static rotation
            treeCount++;                          // Increment tree count
            hole.active = 0;                      // Deactivate the hole
            strcpy(statusText, "Tree growing");   // Update status text
            showStatus = 1;                       // Show status text
        }
    }
    if (key == 'r' || key == 'R') {
        raining = !raining; // Toggle raining on/off
    }
    // Toggle individual lights based on number keys
    if (key == '1') light0_enabled = !light0_enabled;
    if (key == '2') light1_enabled = !light1_enabled;
    if (key == '3') light2_enabled = !light2_enabled;
    if (key == '4') light3_enabled = !light3_enabled;
    if (key == '5') light4_enabled = !light4_enabled;
}

void keyboardUp(unsigned char key, int x, int y) {
    keyStates[key] = 0; // Mark the key as released
}

void idle() {
    // Calculate forward/backward movement vector
    float lx = sin(camYaw);
    float lz = -cos(camYaw);
    // Calculate strafing movement vector
    float strafeLx = sin(camYaw - M_PI / 2);
    float strafeLz = -cos(camYaw - M_PI / 2);

    // Apply camera movement based on key states
    if (keyStates['w'] || keyStates['W']) { camX += lx * moveSpeed; camZ += lz * moveSpeed; }
    if (keyStates['s'] || keyStates['S']) { camX -= lx * moveSpeed; camZ -= lz * moveSpeed; }
    if (keyStates['a'] || keyStates['A']) { camX += strafeLx * moveSpeed; camZ += strafeLz * moveSpeed; }
    if (keyStates['d'] || keyStates['D']) { camX -= strafeLx * moveSpeed; camZ -= strafeLz * moveSpeed; }

    // Update tree growth
    for (int i = 0; i < treeCount; i++) {
        if (trees[i].growing) {
            trees[i].growth += trees[i].growthSpeed; // Increase growth factor
            if (trees[i].growth >= 1.0f) {
                trees[i].growth = 1.0f; // Cap growth at full size
                trees[i].growing = 0;   // Stop growing
                strcpy(statusText, ""); // Clear status text
                showStatus = 0;         // Hide status text
            }
        }
    }

    // Update cloud and rain positions
    for (int i = 0; i < MAX_CLOUDS; i++) {
        clouds[i].x += clouds[i].speed; // Move cloud horizontally
        if (clouds[i].x > 300) clouds[i].x = -300; // Loop cloud position when it goes off screen
        if (raining) {
            for (int j = 0; j < MAX_RAIN; j++) {
                rain[i][j].y -= rain[i][j].speed; // Make raindrop fall
                if (rain[i][j].y <= 0) { // If raindrop hits ground, reset its position
                    rain[i][j].x = clouds[i].x + ((rand() % 20) - 10);
                    rain[i][j].z = clouds[i].z + ((rand() % 20) - 10);
                    rain[i][j].y = clouds[i].y; // Reset to cloud's height
                }
            }
        }
    }

    glutPostRedisplay(); // Request a redraw of the scene
}

void specialKeys(int key, int x, int y) {
    if (key == GLUT_KEY_LEFT) camYaw -= 0.05f;  // Rotate camera left
    if (key == GLUT_KEY_RIGHT) camYaw += 0.05f; // Rotate camera right
    if (key == GLUT_KEY_UP) camPitch += 0.02f;  // Look up
    if (key == GLUT_KEY_DOWN) camPitch -= 0.02f; // Look down
    // Clamp pitch to prevent camera from flipping upside down
    if (camPitch > M_PI/4) camPitch = M_PI/4;
    if (camPitch < -M_PI/4) camPitch = -M_PI/4;
}

int main(int argc, char **argv) {
    glutInit(&argc, argv); // Initialize GLUT
    // Set display mode: double buffer, RGB color, depth buffer
    glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB | GLUT_DEPTH);
    glutInitWindowSize(1024, 768); // Set initial window size
    glutCreateWindow("VR Forest - Final Version"); // Create the window with a title

    init(); // Call custom initialization function

    glutDisplayFunc(display);       // Register display callback
    glutReshapeFunc(reshape);       // Register reshape callback
    glutKeyboardFunc(keyboard);     // Register keyboard press callback
    glutKeyboardUpFunc(keyboardUp); // Register keyboard release callback
    glutSpecialFunc(specialKeys);   // Register special keys callback
    glutIdleFunc(idle);             // Register idle callback for continuous updates

    glutMainLoop(); // Enter the GLUT event processing loop
    return 0;
}