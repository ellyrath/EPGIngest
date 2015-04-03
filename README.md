# EPGIngest
Program to parse EPG data into a form that can be ingested into the database

# Setup
1. Clone the repo _git clone https://github.com/ellyrath/EPGIngest.git_
2. Run _npm install_
3. Run _nodemon app.js_

# Parsing Programs
1. Create a folder called _xmls_ in the root directory
2. Copy files named _programs.xml_ into the _xmls_ directory
3. Open the browser and go to http://localhost:3000/programs (use the proper domain if not running locally)
4. Check the console to know that the process has finished
5. **3** text files, _**programs-cast.txt**_, _**programs-image.txt**_ and _**programs.txt**_ should have been created under the directory _**output**_

# Parsing Sources
1. Create a folder called _xmls_ in the root directory
2. Copy files named _sources.xml_ into the _xmls_ directory
3. Open the browser and go to http://localhost:3000/sources (use the proper domain if not running locally)
4. Check the console to know that the process has finished
5. **2** text files, _**sources-images.txt**_ and _**sources.txt**_ should have been created under the directory _**output**_

# Parsing Schedules
1. Create a folder called _xmls_ in the root directory
2. Copy files named _schedules.xml_ into the _xmls_ directory
3. Open the browser and go to http://localhost:3000/schedules (use the proper domain if not running locally)
4. Check the console to know that the process has finished
5. **1** text file, _**schedules.txt**_ should have been created under the directory _**output**_
