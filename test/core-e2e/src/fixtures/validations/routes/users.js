/*
Copyright 2021 Javier Brea

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

const USERS = [
  {
    id: 1,
    name: "John Doe",
  },
  {
    id: 2,
    name: "Jane Doe",
  },
];

module.exports = [
  {
    id: "get-user",
    url: "/api/users/:id",
    method: "GET",
    variants: [
      {
        id: "1",
        type: "json",
        options: {
          status: 200,
          body: USERS[0],
        },
      },
      {
        id: "2",
        type: "json",
        options: {
          status: 200,
          body: USERS[1],
        },
      },
    ],
  },
  {
    id: "get-user-variant-invalid",
    url: "/api/invalid-users/:id",
    method: "GET",
    variants: [
      {
        id: "1",
        type: "json",
        options: {
          status: 200,
          body: USERS[0],
        },
      },
      {
        id: "1",
        type: "json",
        options: {
          status: 200,
          body: USERS[0],
        },
      },
      {
        id: "2",
        type: "json",
        options: null,
      },
    ],
  },
  {
    id: "get-user-variant-invalid",
    url: "/api/invalid-users/:id",
    method: "GET",
    variants: [
      {
        id: "2",
        type: "json",
        options: {
          status: 200,
          body: USERS[1],
        },
      },
    ],
  },
  {
    id: "get-users-invalid",
    url: "/api/invalid-users",
    method: "foo",
    variants: [
      {
        id: "success",
      },
    ],
  },
];
