#!/usr/bin/env bash

config_dir=$(pwd)
root_dir=$(dirname "$0")

mkdir $config_dir/build

FILEDIR="$config_dir/src"
VALIDATORDIR="$FILEDIR/validators"
DESTDIR="$config_dir/build"


echo '
**********************************************************
*******   CMS Fleetmanager: Packaging Lambdas     ********
**********************************************************
'
# run through all files and zip them up with their dependencies.
# The zipped directory is where the Cloudformation template references zipped files per lambda
if [ $# -eq 0 ]; then
    for f in ${FILEDIR}/*
    do
        if [ ${f: -3} == ".py" ]
        then
            file=${f}
            echo "File path $file"
            filename=${f%.*}
            basename=$(basename $filename)

            # specific to Elasticsearch file that creates indexes/mappings on deployment
            if [ $basename == "cdf_auto_fleetmanager_elasticsearch_helper" ]
            then
                echo "Elasticsearch helper, combine with json file..."
                helper_file=${FILEDIR}/elasticsearch_index_mapper.json
                zip -j "cdf_auto_fleetmanager_elasticsearch_helper.zip" "$file" "$helper_file"
                mv "cdf_auto_fleetmanager_elasticsearch_helper.zip" "$DESTDIR"
                echo "complete"
            elif [ $basename == "cdf_auto_fleetmanager_anomaly_ddb_es" ] || [ $basename == "cdf_auto_fleetmanager_iot_event_config" ]
            then
                # this file is stand-alone
                zip -j "$filename.zip" "$file"
                mv "$filename.zip" "$DESTDIR"
                echo "complete"
            else
                echo "File w/ validator..."
                set -f
                short_name=(${basename//_/ })
                foo=${short_name[*]: -1}

                # zip together lambda & validator files
                if [ ${short_name[*]: -1} == "events" ] || [ ${short_name[*]: -1} == "rule" ]
                then
                    iot_name=${short_name[*]: -2:1}
                    iot_type=${short_name[*]: -1}
                    validator="${VALIDATORDIR}/${iot_name}_${iot_type}_validator.py"
                    zip -j "$filename.zip" "$file" "$validator"
                    mv "$filename.zip" "$DESTDIR"
                    echo "complete"
                fi
            fi
        fi
    done
fi

./package.bash