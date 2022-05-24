#!/bin/bash
#
# This assumes all of the OS-level configuration has been completed and git repo has already been cloned
#
# This script should be run from the repo's deployment directory
# cd deployment
# ./build-s3-dist.sh source-bucket-base-name solution-name version-code
#
# Paramenters:
#  - source-bucket-base-name: Name for the S3 bucket location where the template will source the Lambda
#    code from. The template will append '-[region_name]' to this bucket name.
#    For example: ./build-s3-dist.sh solutions my-solution v1.0.0
#    The template will then expect the source code to be located in the solutions-[region_name] bucket
#
#  - solution-name: name of the solution for consistency
#
#  - version-code: version of the package

# Check to see if input has been provided:
if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]  ; then
    echo "Please provide the base source bucket name, trademark approved solution name and version where the lambda code will eventually reside."
    echo "For example: ./build-s3-dist.sh solutions trademarked-solution-name v1.0.0"
    exit 1
fi

# Get reference for all important folders
template_dir="$PWD"
template_dist_dir="$template_dir/global-s3-assets"
build_dist_dir="$template_dir/regional-s3-assets"
source_dir="$template_dir/../source"

echo "------------------------------------------------------------------------------"
echo "[Init] Clean old dist, node_modules and bower_components folders"
echo "------------------------------------------------------------------------------"
echo "rm -rf $template_dist_dir"
rm -rf $template_dist_dir
echo "mkdir -p $template_dist_dir"
mkdir -p $template_dist_dir
echo "rm -rf $build_dist_dir"
rm -rf $build_dist_dir
echo "mkdir -p $build_dist_dir"
mkdir -p $build_dist_dir

echo "------------------------------------------------------------------------------"
echo "[Rebuild] Package cms-fleetmanager-backend"
echo "------------------------------------------------------------------------------"
#**Note: bundled before packging templates due to a custom step in the ./package.sh script which modifies the cfn templates.

cd $source_dir/packages/fleetmanager-backend
./package.bash

echo "------------------------------------------------------------------------------"
echo "[Packing] Templates"
echo "------------------------------------------------------------------------------"
echo "copy yaml templates and rename"

# copy template from infrastructure
cp $source_dir/infrastructure/*.yaml $template_dist_dir
cp $source_dir/infrastructure/cloudformation/*.yaml $template_dist_dir

# copy all yaml from infrastructure dir withing individual packages
cp $source_dir/packages/*/infrastructure/*.yaml $template_dist_dir


# Copy json templates from the cdf-auto-fleetmanager-backend
cp $source_dir/packages/*/infrastructure/build/*.json $template_dist_dir/cfn-cms-fleetmanager-backend.template

cd $template_dist_dir

#Rename all *.yaml to *.template
for f in *.yaml; do
    mv -- "$f" "${f%.yaml}.template"
done

# apply S3 Code Uri and TemplateURL override on all yaml templates
for f in *.template; do
    if [ -f "../transforms/${f%.*}.yaml" ]; then
        yq w -i -s "../transforms/${f%.*}.yaml" "$f"
    fi
done

# apply S3 Code Uri and TemplateURL transform on all json templates
for f in *.template; do
    if [ -f "../transforms/${f%.*}.json" ]; then
        jq --argfile override "../transforms/${f%.*}.json" '. * $override' "$f" > tmp.$$.json && mv tmp.$$.json $f
    fi
done

cd ..
echo "Updating code source bucket in template with $1"
replace="s/%%BUCKET_NAME%%/$1/g"

echo "sed -i '' -e $replace $template_dist_dir/*.template"
sed -i -e $replace $template_dist_dir/*.template
replace="s/%%SOLUTION_NAME%%/$2/g"

echo "sed -i '' -e $replace $template_dist_dir/*.template"
sed -i -e $replace $template_dist_dir/*.template
replace="s/%%VERSION%%/$3/g"

echo "sed -i '' -e $replace $template_dist_dir/*.template"
sed -i -e $replace $template_dist_dir/*.template

replace="s/%%TEMPLATE_BUCKET_NAME%%/$4/g"
sed -i -e $replace $template_dist_dir/*.template

#echo "------------------------------------------------------------------------------"
#echo "[Rebuild] Bundle Applications"
#echo "------------------------------------------------------------------------------"
 # bundle source packages
 #cd $source_dir
#./bundle.bash

echo "------------------------------------------------------------------------------"
echo "[Rebuild] Copy bundled artifacts"
echo "------------------------------------------------------------------------------"

# Copy and rename cdf-auto-cvra dist
cd $build_dist_dir
cp $source_dir/packages/cvra/bundle.zip $build_dist_dir/
mv bundle.zip cms-cvra.zip

# Copy and rename cdf-auto-facade dist
cd $build_dist_dir
cp $source_dir/packages/cdf-auto-facade/bundle.zip $build_dist_dir/
mv bundle.zip cdf-auto-facade.zip

# Copy and rename cdf-auto-infrastructure dist
cd $build_dist_dir
cp $source_dir/packages/cdf-clients/core/deployment-helper/bundle.zip $build_dist_dir/cms-deployment-helper.zip

# Copy and rename cdf-auto-fleetmanager-backend dist
cd $build_dist_dir
cp $source_dir/packages/fleetmanager-backend/build/*.zip $build_dist_dir/
cp $source_dir/packages/fleetmanager-backend/infrastructure/build/deployment.zip $build_dist_dir/cdf_auto_fleetmanager_api.zip

# Copy cdf-auto-fleetmanager-ui dist
# **Note: the -a flag is to copy dir recursively
#cd $build_dist_dir
#mkdir $build_dist_dir/cms-fleetmanager-ui/
#cp -a $source_dir/packages/fleetmanager-ui/build/ $build_dist_dir/cms-fleetmanager-ui/

# Copy cdf-auto-fleetmanager-ui-helper dist
cd $build_dist_dir
cp $source_dir/packages/fleetmanager-ui/infrastructure/helper/build/cms-fleetmanager-ui-helper.zip $build_dist_dir/

# Copy cdf-auto-simulation-modules and rename
cd $build_dist_dir
mkdir $build_dist_dir/cms-simulation-modules
cp $source_dir/packages/simulation-modules/auto-route-gen/bundle.zip $build_dist_dir/cms-simulation-modules/auto-route-gen.zip
cp $source_dir/packages/simulation-modules/auto-simulation-engine/bundle.zip $build_dist_dir/cms-simulation-modules/simulation-engine.zip
cp $source_dir/packages/simulation-modules/data-generator-auto/bundle.zip $build_dist_dir/cms-simulation-modules/data-generator.zip


